import { isPayPalOrderId } from "@/lib/paypal-order-id";

/** Identifiant de commande PayPal lié à une capture, ou un signal de traitement. */
export function paypalCaptureOrderId(event: unknown): string | "ignore" | "invalid" {
  if (!event || typeof event !== "object" || Array.isArray(event)) return "invalid";
  const type = (event as { event_type?: unknown }).event_type;
  if (typeof type !== "string") return "invalid";
  if (type !== "PAYMENT.CAPTURE.COMPLETED") return "ignore";

  const resource = (event as { resource?: unknown }).resource;
  if (!resource || typeof resource !== "object" || Array.isArray(resource)) return "invalid";
  const related = (resource as { supplementary_data?: { related_ids?: { order_id?: unknown } } }).supplementary_data
    ?.related_ids?.order_id;
  if (typeof related !== "string" || !isPayPalOrderId(related)) return "invalid";
  return related.trim();
}
