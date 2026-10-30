import { NextResponse } from "next/server";
import { quoteCheckout } from "@/lib/checkout-quote";
import { loadPayPalDraft, quoteFromDraft } from "@/lib/paypal-draft";
import { persistPayPalPayment } from "@/lib/paypal-persist";
import {
  fetchPayPalOrder,
  paypalWebhookConfigured,
  readPayPalWebhookHeaders,
  readVerifiedPayment,
  verifyPayPalWebhookSignature,
} from "@/lib/paypal-server";
import { paypalCaptureOrderId } from "@/lib/paypal-webhook";
import { clientIp, limitPayPalWebhook } from "@/lib/ratelimit";

export const runtime = "nodejs";

const MAX_BODY = 100_000;

function unavailable() {
  return NextResponse.json({ error: "Enregistrement indisponible." }, { status: 503 });
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY) {
    return NextResponse.json({ error: "Notification invalide." }, { status: 400 });
  }

  let raw = "";
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json({ error: "Notification invalide." }, { status: 400 });
  }
  if (raw.length === 0 || raw.length > MAX_BODY) {
    return NextResponse.json({ error: "Notification invalide." }, { status: 400 });
  }

  let event: unknown;
  try {
    event = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json({ error: "Notification invalide." }, { status: 400 });
  }
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    return NextResponse.json({ error: "Notification invalide." }, { status: 400 });
  }

  const signature = readPayPalWebhookHeaders(request);
  if (!signature) {
    return NextResponse.json({ error: "Notification invalide." }, { status: 400 });
  }

  const gate = await limitPayPalWebhook(clientIp(request));
  if (!gate.ok) {
    const headers: Record<string, string> = {};
    if (gate.status === 429) headers["Retry-After"] = String(gate.retryAfter);
    return NextResponse.json({ error: gate.error }, { status: gate.status, headers });
  }

  if (!paypalWebhookConfigured()) return unavailable();

  const verdict = await verifyPayPalWebhookSignature(signature, event);
  if (verdict === "unavailable") return unavailable();
  if (verdict !== "ok") {
    return NextResponse.json({ error: "Notification refusée." }, { status: 401 });
  }

  const orderId = paypalCaptureOrderId(event);
  if (orderId === "ignore") return NextResponse.json({ received: true });
  if (orderId === "invalid") {
    console.error("PayPal webhook sans commande");
    return NextResponse.json({ received: true });
  }

  const draft = await loadPayPalDraft(orderId);
  if (draft === "unavailable") return unavailable();
  if (draft === "missing" || draft === "invalid") {
    console.error("PayPal webhook sans brouillon", orderId);
    return NextResponse.json({ received: true });
  }

  let quote = quoteFromDraft(draft);
  try {
    const fresh = await quoteCheckout(draft.lines);
    if (fresh && fresh.digest === draft.digest && fresh.totalCents === draft.totalCents) {
      quote = fresh;
    }
  } catch (error) {
    console.error("Catalogue injoignable", error instanceof Error ? error.message : "erreur");
  }

  try {
    const fetched = await fetchPayPalOrder(orderId);
    if (!fetched.ok) {
      console.error("PayPal webhook lecture", fetched.issue);
      if (fetched.status >= 500 || fetched.status === 429 || fetched.issue === "oauth" || fetched.issue === "unconfigured") {
        return unavailable();
      }
      return NextResponse.json({ received: true });
    }

    const payment = readVerifiedPayment(fetched.order, quote);
    if (!payment || payment.orderId !== orderId) {
      console.error("PayPal webhook montant refusé", orderId);
      if (fetched.order.status !== "COMPLETED") return unavailable();
      return NextResponse.json({ received: true });
    }

    const saved = await persistPayPalPayment(payment, quote);
    if (!saved.ok) {
      if (saved.status === 503) return unavailable();
      console.error("PayPal webhook conflit", orderId);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("PayPal webhook enregistrement", error instanceof Error ? error.message : "erreur");
    return unavailable();
  }
}
