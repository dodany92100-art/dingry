import type { OrderResponseBody } from "@paypal/paypal-js";

export type PayPalPaymentResult = {
  orderId: string;
  payerName: string;
  email: string;
  total: number;
  shippingName: string;
  shippingAddress: string;
};

function formatShippingAddress(
  address: {
    address_line_1?: string;
    address_line_2?: string;
    admin_area_2?: string;
    postal_code?: string;
    country_code?: string;
  } | undefined,
): string {
  if (!address) return "";
  const parts = [
    address.address_line_1,
    address.address_line_2,
    [address.postal_code, address.admin_area_2].filter(Boolean).join(" "),
    address.country_code,
  ].filter((part) => part && String(part).trim().length > 0);
  return parts.join(", ");
}

export function parsePayPalCapture(details: OrderResponseBody, fallbackOrderId: string): PayPalPaymentResult {
  const unit = details.purchase_units?.[0];
  const given = details.payer?.name?.given_name?.trim() ?? "";
  const family = details.payer?.name?.surname?.trim() ?? "";
  const payerName = `${given} ${family}`.trim() || unit?.shipping?.name?.full_name?.trim() || "Client PayPal";

  const captureAmount = unit?.payments?.captures?.[0]?.amount?.value;
  const unitAmount = unit?.amount?.value;
  const parsedTotal = Number(captureAmount ?? unitAmount ?? 0);

  return {
    orderId: details.id?.trim() || fallbackOrderId,
    payerName,
    email: details.payer?.email_address?.trim() ?? "",
    total: Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : 0,
    shippingName: unit?.shipping?.name?.full_name?.trim() ?? payerName,
    shippingAddress: formatShippingAddress(unit?.shipping?.address),
  };
}
