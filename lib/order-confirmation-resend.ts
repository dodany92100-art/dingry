import type { AdminOrder } from "@/lib/admin/types";
import type { CheckoutQuote } from "@/lib/checkout-quote";
import { sendCustomerOrderConfirmation } from "@/lib/order-confirmation-email";
import { loadPayPalDraft, quoteFromDraft } from "@/lib/paypal-draft";
import type { VerifiedPayPalPayment } from "@/lib/paypal-server";

export type ResendOrderConfirmationResult =
  | { ok: true }
  | { ok: false; error: string };

export function paymentFromAdminOrder(order: AdminOrder): VerifiedPayPalPayment {
  return {
    orderId: order.id,
    captureId: order.captureId?.trim() || "—",
    payerName: order.customerName,
    email: order.email,
    totalCents: Math.round(order.total * 100),
    currency: "EUR",
    shippingName: order.shippingName?.trim() || order.customerName,
    shippingAddress: order.shippingAddress?.trim() || "",
  };
}

export function checkoutQuoteFallbackFromOrder(order: AdminOrder): CheckoutQuote {
  return {
    lines: [],
    totalCents: Math.round(order.total * 100),
    currency: "EUR",
    items: order.items,
    paypalItems: [],
    digest: "0".repeat(64),
    ...(order.customerPhone ? { customerPhone: order.customerPhone } : {}),
  };
}

export async function resolveCheckoutQuoteForOrder(order: AdminOrder): Promise<CheckoutQuote> {
  const draft = await loadPayPalDraft(order.id);
  if (draft && typeof draft === "object") {
    return quoteFromDraft(draft);
  }
  return checkoutQuoteFallbackFromOrder(order);
}

export async function resendCustomerOrderConfirmation(order: AdminOrder): Promise<ResendOrderConfirmationResult> {
  const payment = paymentFromAdminOrder(order);
  const quote = await resolveCheckoutQuoteForOrder(order);
  const sent = await sendCustomerOrderConfirmation(order, payment, quote, { forceResend: true });
  if (sent) return { ok: true };
  return {
    ok: false,
    error:
      "Envoi impossible (e-mail invalide, Resend indisponible ou clé RESEND / OPS_ALERT_FROM manquante). Consultez les logs.",
  };
}
