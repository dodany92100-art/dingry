import { isPayPalOrderId } from "@/lib/paypal-order-id";

const REFUND_ALERT_TYPES = new Set(["PAYMENT.CAPTURE.REFUNDED", "PAYMENT.CAPTURE.REVERSED"]);

export function paypalWebhookEventType(event: unknown): string | null {
  if (!event || typeof event !== "object" || Array.isArray(event)) return null;
  const type = (event as { event_type?: unknown }).event_type;
  return typeof type === "string" ? type : null;
}

export function paypalRefundAlertType(event: unknown): string | null {
  const type = paypalWebhookEventType(event);
  if (!type || !REFUND_ALERT_TYPES.has(type)) return null;
  return type;
}

function readCaptureResourceIds(event: unknown): { captureId?: string; orderId?: string } {
  const resource = (event as { resource?: unknown }).resource;
  if (!resource || typeof resource !== "object" || Array.isArray(resource)) return {};
  const record = resource as {
    id?: unknown;
    supplementary_data?: { related_ids?: { order_id?: unknown } };
  };
  const captureId = typeof record.id === "string" && record.id.length > 0 ? record.id : undefined;
  const related = record.supplementary_data?.related_ids?.order_id;
  const orderId =
    typeof related === "string" && isPayPalOrderId(related) ? related.trim() : undefined;
  return { captureId, orderId };
}

export function paypalRefundAlertContext(
  event: unknown,
): { eventType: string; captureId?: string; orderId?: string } | null {
  const eventType = paypalRefundAlertType(event);
  if (!eventType) return null;
  return { eventType, ...readCaptureResourceIds(event) };
}

/** Identifiant de commande PayPal lié à une capture, ou un signal de traitement. */
export function paypalCaptureOrderId(event: unknown): string | "ignore" | "invalid" {
  const type = paypalWebhookEventType(event);
  if (!type) return "invalid";
  if (type !== "PAYMENT.CAPTURE.COMPLETED") return "ignore";

  const { orderId } = readCaptureResourceIds(event);
  if (!orderId) return "invalid";
  return orderId;
}

export function paypalCaptureResourceIds(event: unknown): { captureId?: string; orderId?: string } {
  if (paypalWebhookEventType(event) !== "PAYMENT.CAPTURE.COMPLETED") return {};
  return readCaptureResourceIds(event);
}
