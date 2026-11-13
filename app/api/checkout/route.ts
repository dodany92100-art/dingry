import { Buffer } from "node:buffer";
import type { AdminOrder } from "@/lib/admin/types";
import { StoreUnavailableError } from "@/lib/admin/store";
import { customerPhoneFromBody } from "@/lib/checkout-phone";
import { parseCheckoutLines, quoteCheckout, type CheckoutQuote } from "@/lib/checkout-quote";
import { StockCheckoutError } from "@/lib/stock";
import { loadPayPalDraft, quoteFromDraft, savePayPalDraft } from "@/lib/paypal-draft";
import { isPayPalOrderId } from "@/lib/paypal-order-id";
import { PAYPAL_ORDER_FINALIZING_MESSAGE, persistPayPalPayment } from "@/lib/paypal-persist";
import {
  capturePayPalOrder,
  createPayPalOrder,
  fetchPayPalOrder,
  diagnosePayPalQuoteMismatch,
  orderReadyToCapture,
  paypalConfigured,
  readPayPalAmountDebug,
  readVerifiedPayment,
} from "@/lib/paypal-server";
import { payPalReturnOrigin } from "@/lib/paypal-return-origin";
import { limitCheckoutEntry, limitCheckoutPayment, limitCheckoutQuote } from "@/lib/ratelimit";
import { clientIp } from "@/lib/request-ip";
import { jsonNoStore } from "@/lib/http";
import { markPayPalPaymentOrphan, sendOpsAlertOnce } from "@/lib/ops-alert";
import { turnstileRemoteIp, turnstileTokenFromBody, verifyTurnstileToken } from "@/lib/turnstile";
import { deferAfter } from "@/lib/defer-after";
import { CHECKOUT_CODES, checkoutErrorResponse } from "@/lib/checkout-diagnostic";

export const runtime = "nodejs";
/** Inférieur au TTL du verrou Redis PayPal (`PAYPAL_ORDER_LOCK_TTL_SECONDS`). */
export const maxDuration = 60;

const CHECKOUT_MAX_BODY = 32_000;

type RateGate = Exclude<Awaited<ReturnType<typeof limitCheckoutEntry>>, { ok: true }>;

function limited(gate: RateGate) {
  const headers: Record<string, string> = {};
  if (gate.status === 429) {
    headers["Retry-After"] = String(gate.retryAfter);
    headers["X-RateLimit-Limit"] = String(gate.limit);
    headers["X-RateLimit-Remaining"] = String(gate.remaining);
  }
  return checkoutErrorResponse(CHECKOUT_CODES.RATE_LIMIT, gate.error, gate.status, { headers });
}

function rateHeaders(gate: { limit: number; remaining: number }): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(gate.limit),
    "X-RateLimit-Remaining": String(gate.remaining),
  };
}

function persistFailed(
  saved: { ok: false; status: 409 | 503; error: string },
  orderId: string,
) {
  if (saved.status === 503 && saved.error === PAYPAL_ORDER_FINALIZING_MESSAGE) {
    return checkoutErrorResponse(CHECKOUT_CODES.FINALIZING, saved.error, saved.status, {
      headers: { "Retry-After": "3" },
      log: { orderId },
    });
  }
  if (saved.status === 409) {
    return checkoutErrorResponse(CHECKOUT_CODES.PERSIST_ORPHAN, saved.error, 409, { log: { orderId } });
  }
  const error = `Paiement reçu, contactez-nous avec la référence ${orderId}.`;
  return checkoutErrorResponse(CHECKOUT_CODES.PERSIST_ORPHAN, error, saved.status, { log: { orderId } });
}

async function notifyMissingPayPalDraft(orderId: string, reason: string): Promise<void> {
  await markPayPalPaymentOrphan(orderId, reason);
  deferAfter(() => {
    void sendOpsAlertOnce(`draft-missing:${orderId}`, "Brouillon PayPal absent à la capture", {
      orderId,
      reason,
    });
  });
}

function confirmationOf(order: AdminOrder) {
  return {
    orderId: order.id,
    payerName: order.customerName,
    email: order.email,
    total: order.total,
    items: order.items,
    shippingName: order.shippingName ?? "",
    shippingAddress: order.shippingAddress ?? "",
  };
}

function isCheckoutIntent(value: unknown): value is "quote" | "create" | "capture" {
  return value === "quote" || value === "create" || value === "capture";
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const entryGate = await limitCheckoutEntry(ip);
  if (!entryGate.ok) return limited(entryGate);

  const contentLength = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(contentLength) && contentLength > CHECKOUT_MAX_BODY) {
    return checkoutErrorResponse(CHECKOUT_CODES.INVALID, "Commande invalide.", 400);
  }

  let raw = "";
  try {
    raw = await request.text();
  } catch {
    return checkoutErrorResponse(CHECKOUT_CODES.INVALID, "Commande invalide.", 400);
  }
  if (Buffer.byteLength(raw, "utf8") === 0 || Buffer.byteLength(raw, "utf8") > CHECKOUT_MAX_BODY) {
    return checkoutErrorResponse(CHECKOUT_CODES.INVALID, "Commande invalide.", 400);
  }

  let body: unknown;
  try {
    body = JSON.parse(raw) as unknown;
  } catch {
    return checkoutErrorResponse(CHECKOUT_CODES.INVALID, "Commande invalide.", 400);
  }

  if (!body || typeof body !== "object") {
    return checkoutErrorResponse(CHECKOUT_CODES.INVALID, "Commande invalide.", 400);
  }

  const intent = (body as { intent?: unknown }).intent;
  if (!isCheckoutIntent(intent)) {
    return checkoutErrorResponse(CHECKOUT_CODES.INVALID, "Commande invalide.", 400);
  }

  const gate =
    intent === "quote" ? await limitCheckoutQuote(ip) : await limitCheckoutPayment(ip);
  if (!gate.ok) return limited(gate);

  if (intent === "capture") {
    // Turnstile uniquement sur `create` : brouillon + limiteur + vérif PayPal côté serveur.
    if (!paypalConfigured()) {
      return checkoutErrorResponse(CHECKOUT_CODES.PAYMENT_UNAVAILABLE, "Paiement indisponible.", 503, {
        log: { intent: "capture" },
      });
    }

    const rawOrderId = (body as { orderId?: unknown }).orderId;
    const orderId = typeof rawOrderId === "string" ? rawOrderId.trim() : "";
    if (!isPayPalOrderId(orderId)) {
      return checkoutErrorResponse(CHECKOUT_CODES.INVALID, "Commande invalide.", 400, { log: { intent: "capture" } });
    }

    const draft = await loadPayPalDraft(orderId);
    if (draft === "unavailable") {
      return checkoutErrorResponse(CHECKOUT_CODES.PAYMENT_UNAVAILABLE, "Paiement indisponible.", 503, {
        log: { intent: "capture", orderId },
      });
    }
    if (draft === "missing" || draft === "invalid") {
      const orphanReason =
        draft === "missing"
          ? "brouillon Redis absent à la capture (expiré ou perdu)"
          : "brouillon Redis invalide à la capture";
      await notifyMissingPayPalDraft(orderId, orphanReason);
      return checkoutErrorResponse(
        CHECKOUT_CODES.DRAFT_MISSING,
        "Brouillon de commande introuvable. Réessayez depuis le paiement ou contactez-nous avec la référence PayPal.",
        503,
        { log: { intent: "capture", orderId } },
      );
    }
    const quote = quoteFromDraft(draft);

    try {
      const fetched = await fetchPayPalOrder(orderId);
      if (!fetched.ok) {
        const status = fetched.status === 503 ? 503 : 400;
        const error = status === 503 ? "Paiement indisponible." : "Paiement PayPal introuvable.";
        const code = status === 503 ? CHECKOUT_CODES.PAYMENT_UNAVAILABLE : CHECKOUT_CODES.PAYPAL_API;
        return checkoutErrorResponse(code, error, status, {
          log: { intent: "capture", orderId, issue: fetched.issue },
        });
      }

      const lookedUp = fetched.order;
      const ready = orderReadyToCapture(lookedUp, quote);
      if (!ready && lookedUp.status !== "COMPLETED") {
        const issue = diagnosePayPalQuoteMismatch(lookedUp, quote, "APPROVED");
        const amounts = readPayPalAmountDebug(lookedUp);
        return checkoutErrorResponse(
          CHECKOUT_CODES.AMOUNT_MISMATCH,
          "Le montant PayPal ne correspond pas à la commande.",
          400,
          {
            log: {
              intent: "capture",
              orderId,
              issue,
              draftCents: quote.totalCents,
              paypalUnitCents: amounts.unitCents ?? undefined,
              paypalCaptureCents: amounts.captureCents ?? undefined,
            },
          },
        );
      }

      let paypalOrder = lookedUp;
      if (ready) {
        const captured = await capturePayPalOrder(orderId);
        if (!captured.ok) {
          if (captured.issue !== "ORDER_ALREADY_CAPTURED") {
            const status = captured.status === 503 ? 503 : 400;
            const error = status === 503 ? "Paiement indisponible." : "Le paiement PayPal n'a pas abouti.";
            const code = status === 503 ? CHECKOUT_CODES.PAYMENT_UNAVAILABLE : CHECKOUT_CODES.PAYPAL_API;
            return checkoutErrorResponse(code, error, status, {
              log: { intent: "capture", orderId, issue: captured.issue },
            });
          }
          const again = await fetchPayPalOrder(orderId);
          if (!again.ok) {
            return checkoutErrorResponse(CHECKOUT_CODES.PAYMENT_UNAVAILABLE, "Paiement indisponible.", 503, {
              log: { intent: "capture", orderId },
            });
          }
          paypalOrder = again.order;
        } else {
          paypalOrder = captured.order;
        }
      }

      const payment = readVerifiedPayment(paypalOrder, quote);
      if (!payment || payment.orderId !== orderId) {
        const issue = diagnosePayPalQuoteMismatch(paypalOrder, quote, "COMPLETED");
        const amounts = readPayPalAmountDebug(paypalOrder);
        return checkoutErrorResponse(
          CHECKOUT_CODES.AMOUNT_MISMATCH,
          "Le montant PayPal ne correspond pas à la commande.",
          400,
          {
            log: {
              intent: "capture",
              orderId,
              issue,
              draftCents: quote.totalCents,
              paypalUnitCents: amounts.unitCents ?? undefined,
              paypalCaptureCents: amounts.captureCents ?? undefined,
              paypalCustomId: amounts.customId ?? undefined,
            },
          },
        );
      }

      const saved = await persistPayPalPayment(payment, quote);
      if (!saved.ok) {
        return persistFailed(saved, orderId);
      }

      return jsonNoStore(
        { ok: true, order: confirmationOf(saved.order) },
        { headers: rateHeaders(gate) },
      );
    } catch (error) {
      const issue = error instanceof Error ? error.message : "erreur";
      console.error("[checkout] capture exception", { orderId, issue });
      return checkoutErrorResponse(CHECKOUT_CODES.PERSIST_ORPHAN, "Enregistrement indisponible.", 503, {
        log: { intent: "capture", issue },
      });
    }
  }

  const lines = parseCheckoutLines(body);
  if (!lines) {
    return checkoutErrorResponse(CHECKOUT_CODES.INVALID, "Commande invalide.", 400, { log: { intent } });
  }

  let quote: CheckoutQuote | null = null;
  try {
    quote = await quoteCheckout(lines);
  } catch (error) {
    if (error instanceof StockCheckoutError) {
      return checkoutErrorResponse(CHECKOUT_CODES.STOCK, error.message, error.status, { log: { intent } });
    }
    if (error instanceof StoreUnavailableError) {
      return checkoutErrorResponse(CHECKOUT_CODES.STORE, "Dingry collection indisponible.", 503, {
        log: { intent, issue: error.name },
      });
    }
    const issue = error instanceof Error ? error.name : "erreur";
    return checkoutErrorResponse(CHECKOUT_CODES.STORE, "Dingry collection indisponible.", 503, {
      log: { intent, issue },
    });
  }
  if (!quote) {
    return checkoutErrorResponse(
      CHECKOUT_CODES.CATALOG_LINE,
      "Un article du panier ne correspond plus à Dingry collection (retiré, taille ou référence). Videz le panier, rajoutez la pièce depuis la boutique, puis réessayez.",
      400,
      { log: { intent } },
    );
  }

  if (intent === "quote") {
    return jsonNoStore({
      currency: quote.currency,
      totalCents: quote.totalCents,
      lines: quote.lines.map((line, index) => ({
        label: quote.items[index] ?? "",
        size: line.size,
        qty: line.qty,
        amountCents: (quote.paypalItems[index]?.unitCents ?? 0) * line.qty,
      })),
    });
  }

  if (!paypalConfigured()) {
    return checkoutErrorResponse(CHECKOUT_CODES.PAYMENT_UNAVAILABLE, "Paiement indisponible.", 503, {
      log: { intent },
    });
  }

  if (intent === "create") {
    const createVerdict = await verifyTurnstileToken(turnstileTokenFromBody(body), turnstileRemoteIp(request));
    if (!createVerdict.ok) {
      return checkoutErrorResponse(CHECKOUT_CODES.TURNSTILE, createVerdict.error, createVerdict.status, {
        log: { intent: "create" },
      });
    }
    const customerPhone = customerPhoneFromBody(body);
    if (!customerPhone) {
      return checkoutErrorResponse(
        CHECKOUT_CODES.INVALID,
        "Indiquez un numéro de mobile valide (ex. 06 12 34 56 78).",
        400,
        { log: { intent: "create" } },
      );
    }
    const quoteForPay = { ...quote, customerPhone };
    try {
      const returnOrigin = payPalReturnOrigin(request);
      const created = await createPayPalOrder(quoteForPay, { returnOrigin });
      if (!created || !isPayPalOrderId(created.orderId)) {
        return checkoutErrorResponse(
          CHECKOUT_CODES.PAYPAL_API,
          "Le paiement PayPal n'a pas abouti.",
          502,
          { log: { intent: "create" } },
        );
      }
      const drafted = await savePayPalDraft(created.orderId, quoteForPay);
      if (!drafted) {
        return checkoutErrorResponse(
          CHECKOUT_CODES.DRAFT_MISSING,
          "Session de paiement indisponible (brouillon). Vérifiez Redis Upstash puis réessayez.",
          503,
          { log: { intent: "create", orderId: created.orderId } },
        );
      }
      return jsonNoStore(
        { orderId: created.orderId, approvalUrl: created.approvalUrl },
        { headers: rateHeaders(gate) },
      );
    } catch (error) {
      const issue = error instanceof Error ? error.name : "erreur";
      return checkoutErrorResponse(
        CHECKOUT_CODES.PAYPAL_API,
        "Le paiement PayPal n'a pas abouti.",
        502,
        { log: { intent: "create", issue } },
      );
    }
  }

  return checkoutErrorResponse(CHECKOUT_CODES.INVALID, "Commande invalide.", 400, { log: { intent } });
}
