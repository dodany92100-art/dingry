import { Buffer } from "node:buffer";
import type { AdminOrder } from "@/lib/admin/types";
import { StoreUnavailableError } from "@/lib/admin/store";
import { parseCheckoutLines, quoteCheckout, type CheckoutQuote } from "@/lib/checkout-quote";
import { StockCheckoutError } from "@/lib/stock";
import { loadPayPalDraft, quoteFromDraft, savePayPalDraft } from "@/lib/paypal-draft";
import { isPayPalOrderId } from "@/lib/paypal-order-id";
import { PAYPAL_ORDER_FINALIZING_MESSAGE, persistPayPalPayment } from "@/lib/paypal-persist";
import {
  capturePayPalOrder,
  createPayPalOrder,
  fetchPayPalOrder,
  orderReadyToCapture,
  paypalConfigured,
  readVerifiedPayment,
} from "@/lib/paypal-server";
import { limitCheckoutEntry, limitCheckoutPayment, limitCheckoutQuote } from "@/lib/ratelimit";
import { clientIp } from "@/lib/request-ip";
import { jsonNoStore } from "@/lib/http";
import { markPayPalPaymentOrphan, sendOpsAlertOnce } from "@/lib/ops-alert";
import { turnstileRemoteIp, turnstileTokenFromBody, verifyTurnstileToken } from "@/lib/turnstile";
import { deferAfter } from "@/lib/defer-after";

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
  return jsonNoStore({ error: gate.error }, { status: gate.status, headers });
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
  const headers: Record<string, string> = {};
  if (saved.status === 503 && saved.error === PAYPAL_ORDER_FINALIZING_MESSAGE) {
    headers["Retry-After"] = "3";
    return jsonNoStore({ error: saved.error }, { status: saved.status, headers });
  }
  if (saved.status === 409) {
    return jsonNoStore({ error: saved.error }, { status: 409 });
  }
  const error = `Paiement reçu, contactez-nous avec la référence ${orderId}.`;
  return jsonNoStore({ error }, { status: saved.status, headers });
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
    return jsonNoStore({ error: "Commande invalide." }, { status: 400 });
  }

  let raw = "";
  try {
    raw = await request.text();
  } catch {
    return jsonNoStore({ error: "Commande invalide." }, { status: 400 });
  }
  if (Buffer.byteLength(raw, "utf8") === 0 || Buffer.byteLength(raw, "utf8") > CHECKOUT_MAX_BODY) {
    return jsonNoStore({ error: "Commande invalide." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw) as unknown;
  } catch {
    return jsonNoStore({ error: "Commande invalide." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return jsonNoStore({ error: "Commande invalide." }, { status: 400 });
  }

  const intent = (body as { intent?: unknown }).intent;
  if (!isCheckoutIntent(intent)) {
    return jsonNoStore({ error: "Commande invalide." }, { status: 400 });
  }

  const gate =
    intent === "quote" ? await limitCheckoutQuote(ip) : await limitCheckoutPayment(ip);
  if (!gate.ok) return limited(gate);

  if (intent === "capture") {
    // Turnstile uniquement sur `create` : brouillon + limiteur + vérif PayPal côté serveur.
    if (!paypalConfigured()) {
      return jsonNoStore({ error: "Paiement indisponible." }, { status: 503 });
    }

    const rawOrderId = (body as { orderId?: unknown }).orderId;
    const orderId = typeof rawOrderId === "string" ? rawOrderId.trim() : "";
    if (!isPayPalOrderId(orderId)) {
      return jsonNoStore({ error: "Commande invalide." }, { status: 400 });
    }

    const draft = await loadPayPalDraft(orderId);
    if (draft === "unavailable") {
      return jsonNoStore({ error: "Paiement indisponible." }, { status: 503 });
    }
    if (draft === "missing" || draft === "invalid") {
      const orphanReason =
        draft === "missing"
          ? "brouillon Redis absent à la capture (expiré ou perdu)"
          : "brouillon Redis invalide à la capture";
      await notifyMissingPayPalDraft(orderId, orphanReason);
      return jsonNoStore({ error: "Paiement indisponible." }, { status: 503 });
    }
    const quote = quoteFromDraft(draft);

    try {
      const fetched = await fetchPayPalOrder(orderId);
      if (!fetched.ok) {
        console.error("PayPal lecture", fetched.issue);
        const status = fetched.status === 503 ? 503 : 400;
        const error = status === 503 ? "Paiement indisponible." : "Paiement PayPal introuvable.";
        return jsonNoStore({ error }, { status });
      }

      const lookedUp = fetched.order;
      const ready = orderReadyToCapture(lookedUp, quote);
      if (!ready && lookedUp.status !== "COMPLETED") {
        return jsonNoStore(
          { error: "Le montant PayPal ne correspond pas à la commande." },
          { status: 400 },
        );
      }

      let paypalOrder = lookedUp;
      if (ready) {
        const captured = await capturePayPalOrder(orderId);
        if (!captured.ok) {
          console.error("PayPal capture", captured.issue);
          if (captured.issue !== "ORDER_ALREADY_CAPTURED") {
            const status = captured.status === 503 ? 503 : 400;
            const error = status === 503 ? "Paiement indisponible." : "Le paiement PayPal n'a pas abouti.";
            return jsonNoStore({ error }, { status });
          }
          const again = await fetchPayPalOrder(orderId);
          if (!again.ok) {
            return jsonNoStore({ error: "Paiement indisponible." }, { status: 503 });
          }
          paypalOrder = again.order;
        } else {
          paypalOrder = captured.order;
        }
      }

      const payment = readVerifiedPayment(paypalOrder, quote);
      if (!payment || payment.orderId !== orderId) {
        return jsonNoStore(
          { error: "Le montant PayPal ne correspond pas à la commande." },
          { status: 400 },
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
      console.error("Enregistrement commande", error instanceof Error ? error.name : "erreur");
      return jsonNoStore({ error: "Enregistrement indisponible." }, { status: 503 });
    }
  }

  const lines = parseCheckoutLines(body);
  if (!lines) return jsonNoStore({ error: "Commande invalide." }, { status: 400 });

  let quote: CheckoutQuote | null = null;
  try {
    quote = await quoteCheckout(lines);
  } catch (error) {
    if (error instanceof StockCheckoutError) {
      return jsonNoStore({ error: error.message }, { status: error.status });
    }
    if (error instanceof StoreUnavailableError) {
      console.error("Catalogue injoignable", error.name);
      return jsonNoStore({ error: "Dingry collection indisponible." }, { status: 503 });
    }
    console.error("Catalogue injoignable", error instanceof Error ? error.name : "erreur");
    return jsonNoStore({ error: "Dingry collection indisponible." }, { status: 503 });
  }
  if (!quote) {
    return jsonNoStore({ error: "Un article n'est plus dans Dingry collection." }, { status: 400 });
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
    return jsonNoStore({ error: "Paiement indisponible." }, { status: 503 });
  }

  if (intent === "create") {
    const createVerdict = await verifyTurnstileToken(turnstileTokenFromBody(body), turnstileRemoteIp(request));
    if (!createVerdict.ok) {
      return jsonNoStore({ error: createVerdict.error }, { status: createVerdict.status });
    }
    try {
      const created = await createPayPalOrder(quote);
      if (!created || !isPayPalOrderId(created.orderId)) {
        return jsonNoStore({ error: "Le paiement PayPal n'a pas abouti." }, { status: 502 });
      }
      const drafted = await savePayPalDraft(created.orderId, quote);
      if (!drafted && process.env.NODE_ENV !== "development") {
        console.error("Brouillon PayPal non enregistré", created.orderId);
        return jsonNoStore({ error: "Paiement indisponible." }, { status: 503 });
      }
      return jsonNoStore(
        { orderId: created.orderId, approvalUrl: created.approvalUrl },
        { headers: rateHeaders(gate) },
      );
    } catch (error) {
      console.error("PayPal création", error instanceof Error ? error.name : "erreur");
      return jsonNoStore({ error: "Le paiement PayPal n'a pas abouti." }, { status: 502 });
    }
  }

  return jsonNoStore({ error: "Commande invalide." }, { status: 400 });
}
