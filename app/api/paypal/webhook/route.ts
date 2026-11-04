import { after } from "next/server";
import { jsonNoStore } from "@/lib/http";
import { markPayPalPaymentOrphan, sendOpsAlertOnce } from "@/lib/ops-alert";
import { loadPayPalDraft, quoteFromDraft } from "@/lib/paypal-draft";
import { persistPayPalPayment } from "@/lib/paypal-persist";
import {
  fetchPayPalOrder,
  paypalWebhookConfigured,
  readPayPalWebhookHeaders,
  readVerifiedPayment,
  verifyPayPalWebhookSignature,
} from "@/lib/paypal-server";
import {
  paypalCaptureOrderId,
  paypalCaptureResourceIds,
  paypalRefundAlertContext,
  paypalWebhookEventType,
} from "@/lib/paypal-webhook";
import { limitPayPalWebhook } from "@/lib/ratelimit";
import { clientIp } from "@/lib/request-ip";

export const runtime = "nodejs";
export const maxDuration = 30;

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

async function permanentWebhookIssue(
  dedupeId: string,
  subject: string,
  orderId: string | undefined,
  reason: string,
) {
  if (orderId) await markPayPalPaymentOrphan(orderId, reason);
  await sendOpsAlertOnce(dedupeId, subject, { orderId, reason });
  return received();
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

  const signature = readPayPalWebhookHeaders(request);
  if (!signature) {
    return badRequest();
  }

  if (!paypalWebhookConfigured()) {
    logWebhook("webhook_id ou credentials absents");
    return unavailable();
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

  const verdict = await verifyPayPalWebhookSignature(signature, raw);
  if (verdict === "auth") {
    await sendOpsAlertOnce("paypal-webhook-verify-auth", "Webhook PayPal — identifiants", {
      reason: "verify-webhook-signature refusé (401/403 PayPal)",
    });
    return unavailable();
  }
  if (verdict === "unavailable") {
    await sendOpsAlertOnce("paypal-webhook-verify-down", "Webhook PayPal indisponible", {
      reason: "verify-webhook-signature ou OAuth indisponible",
    });
    return unavailable();
  }
  if (verdict !== "ok") {
    return jsonNoStore({ error: "Notification refusée." }, { status: 401 });
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

  const refund = paypalRefundAlertContext(event);
  if (refund) {
    logWebhook("remboursement ou annulation capture", { eventType: refund.eventType });
    const reason = [
      refund.eventType,
      refund.captureId ? `capture ${refund.captureId}` : null,
      refund.orderId ? `commande ${refund.orderId}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    after(() =>
      sendOpsAlertOnce(`refund:${refund.captureId ?? refund.eventType}`, "Remboursement PayPal", {
        orderId: refund.orderId,
        reason,
      }),
    );
    return received();
  }

  const orderId = paypalCaptureOrderId(event);
  if (orderId === "ignore") return received();
  if (orderId === "invalid") {
    const ids = paypalCaptureResourceIds(event);
    logWebhook("capture sans order_id valide", { eventType: paypalWebhookEventType(event) ?? "unknown" });
    return permanentWebhookIssue(
      `capture-invalid:${ids.captureId ?? "unknown"}`,
      "Capture PayPal sans order_id",
      ids.orderId,
      "PAYMENT.CAPTURE.COMPLETED sans order_id valide",
    );
  }

  const draft = await loadPayPalDraft(orderId);
  if (draft === "unavailable") return unavailable();
  if (draft === "missing") {
    logWebhook("brouillon expiré ou absent — intervention manuelle", { orderId });
    return permanentWebhookIssue(
      `draft-missing:${orderId}`,
      "Paiement sans brouillon",
      orderId,
      "brouillon absent ou expiré",
    );
  }
  if (draft === "invalid") {
    logWebhook("brouillon invalide — intervention manuelle", { orderId });
    return permanentWebhookIssue(
      `draft-invalid:${orderId}`,
      "Paiement brouillon invalide",
      orderId,
      "brouillon corrompu",
    );
  }

  const quote = quoteFromDraft(draft);

  try {
    const fetched = await fetchPayPalOrder(orderId);
    if (!fetched.ok) {
      logWebhook("lecture commande PayPal", { orderId, issue: fetched.issue });
      if (fetched.status >= 500 || fetched.status === 429 || fetched.issue === "oauth" || fetched.issue === "unconfigured") {
        return unavailable();
      }
      return permanentWebhookIssue(
        `paypal-order-missing:${orderId}`,
        "Commande PayPal introuvable",
        orderId,
        `GET orders refusé (${fetched.status}, ${fetched.issue})`,
      );
    }

    const payment = readVerifiedPayment(fetched.order, quote);
    if (!payment || payment.orderId !== orderId) {
      if (fetched.order.status === "COMPLETED") {
        logWebhook("ALERTE montant refusé commande payée — intervention manuelle", { orderId });
        return permanentWebhookIssue(
          `amount-rejected:${orderId}`,
          "Paiement sans commande CRM",
          orderId,
          "montant ou digest refusé alors que PayPal est COMPLETED",
        );
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
