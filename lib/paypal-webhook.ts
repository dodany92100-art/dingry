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

/** Identifiant de commande PayPal lié à une capture, ou un signal de traitement. */
export function paypalCaptureOrderId(event: unknown): string | "ignore" | "invalid" {
  const type = paypalWebhookEventType(event);
  if (!type) return "invalid";
  if (type !== "PAYMENT.CAPTURE.COMPLETED") return "ignore";

  const resource = (event as { resource?: unknown }).resource;
  if (!resource || typeof resource !== "object" || Array.isArray(resource)) return "invalid";
  const related = (resource as { supplementary_data?: { related_ids?: { order_id?: unknown } } }).supplementary_data
    ?.related_ids?.order_id;
  if (typeof related !== "string" || !isPayPalOrderId(related)) return "invalid";
  return related.trim();
}
