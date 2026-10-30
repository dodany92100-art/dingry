import { findOrder, insertOrderIfNew } from "@/lib/admin/store";
import type { AdminOrder } from "@/lib/admin/types";
import type { CheckoutQuote } from "@/lib/checkout-quote";
import type { VerifiedPayPalPayment } from "@/lib/paypal-server";
import { claimPayPalOrder, releasePayPalOrder } from "@/lib/ratelimit";

export async function persistPayPalPayment(
  payment: VerifiedPayPalPayment,
  quote: CheckoutQuote,
): Promise<{ ok: true; order: AdminOrder } | { ok: false; status: 409 | 503; error: string }> {
  const total = payment.totalCents / 100;
  const existing = await findOrder(payment.orderId);
  if (existing) {
    if (existing.captureId === payment.captureId && existing.total === total) {
      return { ok: true, order: existing };
    }
    return { ok: false, status: 409, error: "Cette commande est déjà enregistrée." };
  }

  const claim = await claimPayPalOrder(payment.orderId);
  if (claim === "unavailable") {
    return { ok: false, status: 503, error: "Enregistrement indisponible." };
  }
  if (claim === "duplicate") {
    const again = await findOrder(payment.orderId);
    if (again?.captureId === payment.captureId && again.total === total) {
      return { ok: true, order: again };
    }
    return { ok: false, status: 409, error: "Cette commande est déjà enregistrée." };
  }

  const order: AdminOrder = {
    id: payment.orderId,
    captureId: payment.captureId,
    customerName: payment.payerName,
    email: payment.email || "—",
    total,
    items: quote.items,
    status: "En attente",
    createdAt: new Date().toISOString(),
    source: "paypal",
    ...(payment.shippingName ? { shippingName: payment.shippingName } : {}),
    ...(payment.shippingAddress ? { shippingAddress: payment.shippingAddress } : {}),
  };

  try {
    const inserted = await insertOrderIfNew(order);
    if (!inserted) {
      const again = await findOrder(payment.orderId);
      if (again?.captureId === payment.captureId && again.total === total) {
        return { ok: true, order: again };
      }
      return { ok: false, status: 409, error: "Cette commande est déjà enregistrée." };
    }
    return { ok: true, order };
  } catch (error) {
    await releasePayPalOrder(payment.orderId);
    throw error;
  }
}
