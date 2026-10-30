import { NextResponse } from "next/server";
import type { AdminOrder } from "@/lib/admin/types";
import { StoreUnavailableError } from "@/lib/admin/store";
import { parseCheckoutLines, quoteCheckout, type CheckoutQuote } from "@/lib/checkout-quote";
import { StockCheckoutError } from "@/lib/stock";
import { savePayPalDraft } from "@/lib/paypal-draft";
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
import { turnstileRemoteIp, turnstileTokenFromBody, verifyTurnstileToken } from "@/lib/turnstile";

export const runtime = "nodejs";
/** Inférieur au TTL du verrou Redis PayPal (`PAYPAL_ORDER_LOCK_TTL_SECONDS`). */
export const maxDuration = 60;

const CHECKOUT_MAX_BODY = 32_000;

function limited(gate: Exclude<Awaited<ReturnType<typeof limitCheckoutEntry>>, { ok: true }>) {
  const headers: Record<string, string> = {};
  if (gate.status === 429) {
    headers["Retry-After"] = String(gate.retryAfter);
    headers["X-RateLimit-Limit"] = String(gate.limit);
    headers["X-RateLimit-Remaining"] = String(gate.remaining);
  }
  return NextResponse.json({ error: gate.error }, { status: gate.status, headers });
}

function persistFailed(saved: { ok: false; status: 409 | 503; error: string }) {
  const headers: Record<string, string> = {};
  if (saved.status === 503 && saved.error === PAYPAL_ORDER_FINALIZING_MESSAGE) {
    headers["Retry-After"] = "3";
  }
  return NextResponse.json({ error: saved.error }, { status: saved.status, headers });
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


export async function POST(request: Request) {
  const ip = clientIp(request);
  const entryGate = await limitCheckoutEntry(ip);
  if (!entryGate.ok) return limited(entryGate);

  const contentLength = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(contentLength) && contentLength > CHECKOUT_MAX_BODY) {
    return NextResponse.json({ error: "Commande invalide." }, { status: 400 });
  }

  let raw = "";
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json({ error: "Commande invalide." }, { status: 400 });
  }
  if (raw.length === 0 || raw.length > CHECKOUT_MAX_BODY) {
    return NextResponse.json({ error: "Commande invalide." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json({ error: "Commande invalide." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Commande invalide." }, { status: 400 });
  }

  const lines = parseCheckoutLines(body);
  if (!lines) return NextResponse.json({ error: "Commande invalide." }, { status: 400 });

  let quote: CheckoutQuote | null = null;
  try {
    quote = await quoteCheckout(lines);
  } catch (error) {
    if (error instanceof StockCheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof StoreUnavailableError) {
      console.error("Catalogue injoignable", error.name);
      return NextResponse.json({ error: "Dingry collection indisponible." }, { status: 503 });
    }
    console.error("Catalogue injoignable", error instanceof Error ? error.name : "erreur");
    return NextResponse.json({ error: "Dingry collection indisponible." }, { status: 503 });
  }
  if (!quote) {
    return NextResponse.json({ error: "Un article n'est plus dans Dingry collection." }, { status: 400 });
  }
  const priced = quote;

  const intent = (body as { intent?: unknown }).intent;
  const gate =
    intent === "quote" ? await limitCheckoutQuote(ip) : await limitCheckoutPayment(ip);
  if (!gate.ok) return limited(gate);

  if (intent === "quote") {
    return NextResponse.json({
      currency: priced.currency,
      totalCents: priced.totalCents,
      lines: priced.lines.map((line, index) => ({
        label: priced.items[index] ?? "",
        size: line.size,
        qty: line.qty,
        amountCents: (priced.paypalItems[index]?.unitCents ?? 0) * line.qty,
      })),
    });
  }

  if (!paypalConfigured()) {
    return NextResponse.json({ error: "Paiement indisponible." }, { status: 503 });
  }

  if (intent === "create") {
    try {
      const created = await createPayPalOrder(quote);
      if (!created || !isPayPalOrderId(created.orderId)) {
        return NextResponse.json({ error: "Le paiement PayPal n'a pas abouti." }, { status: 502 });
      }
      const drafted = await savePayPalDraft(created.orderId, quote);
      if (!drafted && process.env.NODE_ENV !== "development") {
        console.error("Brouillon PayPal non enregistré", created.orderId);
        return NextResponse.json({ error: "Paiement indisponible." }, { status: 503 });
      }
      return NextResponse.json(
        { orderId: created.orderId },
        {
          headers: {
            "X-RateLimit-Limit": String(gate.limit),
            "X-RateLimit-Remaining": String(gate.remaining),
          },
        },
      );
    } catch (error) {
      console.error("PayPal création", error instanceof Error ? error.message : "erreur");
      return NextResponse.json({ error: "Le paiement PayPal n'a pas abouti." }, { status: 502 });
    }
  }

  if (intent !== "capture") {
    return NextResponse.json({ error: "Commande invalide." }, { status: 400 });
  }

  const verdict = await verifyTurnstileToken(turnstileTokenFromBody(body), turnstileRemoteIp(request));
  if (!verdict.ok) {
    return NextResponse.json({ error: verdict.error }, { status: verdict.status });
  }

  const rawOrderId = (body as { orderId?: unknown }).orderId;
  const orderId = typeof rawOrderId === "string" ? rawOrderId.trim() : "";
  if (!isPayPalOrderId(orderId)) {
    return NextResponse.json({ error: "Commande invalide." }, { status: 400 });
  }

  try {
    const fetched = await fetchPayPalOrder(orderId);
    if (!fetched.ok) {
      console.error("PayPal lecture", fetched.issue);
      const status = fetched.status === 503 ? 503 : 400;
      const error = status === 503 ? "Paiement indisponible." : "Paiement PayPal introuvable.";
      return NextResponse.json({ error }, { status });
    }

    const lookedUp = fetched.order;
    const ready = orderReadyToCapture(lookedUp, quote);
    if (!ready && lookedUp.status !== "COMPLETED") {
      return NextResponse.json({ error: "Le montant PayPal ne correspond pas à la commande." }, { status: 400 });
    }

    let paypalOrder = lookedUp;
    if (ready) {
      const captured = await capturePayPalOrder(orderId);
      if (!captured.ok) {
        console.error("PayPal capture", captured.issue);
        if (captured.issue !== "ORDER_ALREADY_CAPTURED") {
          const status = captured.status === 503 ? 503 : 400;
          const error = status === 503 ? "Paiement indisponible." : "Le paiement PayPal n'a pas abouti.";
          return NextResponse.json({ error }, { status });
        }
        const again = await fetchPayPalOrder(orderId);
        if (!again.ok) {
          return NextResponse.json({ error: "Paiement indisponible." }, { status: 503 });
        }
        paypalOrder = again.order;
      } else {
        paypalOrder = captured.order;
      }
    }

    const payment = readVerifiedPayment(paypalOrder, quote, ready);
    if (!payment || payment.orderId !== orderId) {
      return NextResponse.json({ error: "Le montant PayPal ne correspond pas à la commande." }, { status: 400 });
    }

    const saved = await persistPayPalPayment(payment, quote);
    if (!saved.ok) {
      return persistFailed(saved);
    }

    return NextResponse.json(
      { ok: true, order: confirmationOf(saved.order) },
      {
        headers: {
          "X-RateLimit-Limit": String(gate.limit),
          "X-RateLimit-Remaining": String(gate.remaining),
        },
      },
    );
  } catch (error) {
    console.error("Enregistrement commande", error instanceof Error ? error.message : "erreur");
    return NextResponse.json({ error: "Enregistrement indisponible." }, { status: 503 });
  }
}
