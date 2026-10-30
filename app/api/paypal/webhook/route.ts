import { jsonNoStore } from "@/lib/http";
import { sendOpsAlert } from "@/lib/ops-alert";
import { loadPayPalDraft, quoteFromDraft } from "@/lib/paypal-draft";
import { persistPayPalPayment } from "@/lib/paypal-persist";
import {
  fetchPayPalOrder,
  paypalWebhookConfigured,
  readPayPalWebhookHeaders,
  readVerifiedPayment,
  verifyPayPalWebhookSignature,
} from "@/lib/paypal-server";
import { paypalCaptureOrderId, paypalRefundAlertType, paypalWebhookEventType } from "@/lib/paypal-webhook";
import { limitPayPalWebhook } from "@/lib/ratelimit";
import { clientIp } from "@/lib/request-ip";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 100_000;

function logWebhook(scope: string, details: Record<string, string | undefined> = {}): void {
  console.error(`[paypal-webhook] ${scope}`, details);
}

function unavailable() {
  return jsonNoStore({ error: "Enregistrement indisponible." }, { status: 503 });
}

function received() {
  return jsonNoStore({ received: true });
}

function badRequest() {
  return jsonNoStore({ error: "Notification invalide." }, { status: 400 });
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return badRequest();
  }

  const gate = await limitPayPalWebhook(clientIp(request));
  if (!gate.ok) {
    const headers: Record<string, string> = {};
    if (gate.status === 429) headers["Retry-After"] = String(gate.retryAfter);
    return jsonNoStore({ error: gate.error }, { status: gate.status, headers });
  }

  let raw = "";
  try {
    raw = await request.text();
  } catch {
    return badRequest();
  }

  const bodyBytes = Buffer.byteLength(raw, "utf8");
  if (bodyBytes === 0 || bodyBytes > MAX_BODY_BYTES) {
    return badRequest();
  }

  let event: unknown;
  try {
    event = JSON.parse(raw) as unknown;
  } catch {
    return badRequest();
  }
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    return badRequest();
  }

  const signature = readPayPalWebhookHeaders(request);
  if (!signature) {
    return badRequest();
  }

  if (!paypalWebhookConfigured()) {
    logWebhook("webhook_id ou credentials absents");
    return unavailable();
  }

  const verdict = await verifyPayPalWebhookSignature(signature, raw);
  if (verdict === "unavailable") return unavailable();
  if (verdict !== "ok") {
    return jsonNoStore({ error: "Notification refusée." }, { status: 401 });
  }

  const refundType = paypalRefundAlertType(event);
  if (refundType) {
    logWebhook("remboursement ou annulation capture", { eventType: refundType });
    void sendOpsAlert("Remboursement PayPal", { reason: refundType });
    return received();
  }

  const orderId = paypalCaptureOrderId(event);
  if (orderId === "ignore") return received();
  if (orderId === "invalid") {
    logWebhook("capture sans order_id valide", { eventType: paypalWebhookEventType(event) ?? "unknown" });
    return received();
  }

  const draft = await loadPayPalDraft(orderId);
  if (draft === "unavailable") return unavailable();
  if (draft === "missing") {
    logWebhook("brouillon expiré ou absent — intervention manuelle", { orderId });
    await sendOpsAlert("Paiement sans brouillon", { orderId, reason: "brouillon absent ou expiré" });
    return unavailable();
  }
  if (draft === "invalid") {
    logWebhook("brouillon invalide — intervention manuelle", { orderId });
    await sendOpsAlert("Paiement brouillon invalide", { orderId, reason: "brouillon corrompu" });
    return unavailable();
  }

  const quote = quoteFromDraft(draft);

  try {
    const fetched = await fetchPayPalOrder(orderId);
    if (!fetched.ok) {
      logWebhook("lecture commande PayPal", { orderId, issue: fetched.issue });
      if (fetched.status >= 500 || fetched.status === 429 || fetched.issue === "oauth" || fetched.issue === "unconfigured") {
        return unavailable();
      }
      return received();
    }

    const payment = readVerifiedPayment(fetched.order, quote);
    if (!payment || payment.orderId !== orderId) {
      if (fetched.order.status === "COMPLETED") {
        logWebhook("ALERTE montant refusé commande payée — intervention manuelle", { orderId });
        await sendOpsAlert("Paiement sans commande CRM", {
          orderId,
          reason: "montant ou digest refusé alors que PayPal est COMPLETED",
        });
        return unavailable();
      }
      logWebhook("montant refusé commande non finalisée", { orderId });
      return received();
    }

    const saved = await persistPayPalPayment(payment, quote);
    if (!saved.ok) {
      if (saved.status === 503) return unavailable();
      logWebhook("conflit persistance", { orderId });
    }
    return received();
  } catch (error) {
    logWebhook("enregistrement", { issue: error instanceof Error ? error.name : "erreur" });
    return unavailable();
  }
}
