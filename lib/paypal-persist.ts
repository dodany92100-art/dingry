import { findOrder, insertOrderIfNew, patchOrder, StoreConflictError } from "@/lib/admin/store";
import type { AdminOrder } from "@/lib/admin/types";
import type { CheckoutQuote } from "@/lib/checkout-quote";
import { finalizeOrderStock } from "@/lib/order-stock-finalize";
import { isShippingAddressMissing, patchForReviewReason } from "@/lib/order-review";
import { sendOpsAlertOnce, clearPayPalPaymentOrphan } from "@/lib/ops-alert";
import type { VerifiedPayPalPayment } from "@/lib/paypal-server";
import {
  claimPayPalOrder,
  completePayPalOrder,
  readPayPalOrderMarker,
  releasePayPalOrder,
} from "@/lib/ratelimit";
import { PAYPAL_ORDER_FINALIZING_MESSAGE } from "@/lib/paypal-messages";
import { stockLinesFromCheckout } from "@/lib/stock";
import { deferAfter } from "@/lib/defer-after";

export { PAYPAL_ORDER_FINALIZING_MESSAGE };

function logPayPalPersist(scope: string, orderId: string): void {
  console.error(`[paypal-persist] ${scope}`, { orderId });
}

function orderMatches(existing: AdminOrder, payment: VerifiedPayPalPayment, total: number): boolean {
  return existing.captureId === payment.captureId && existing.total === total;
}

async function reloadOrder(orderId: string, fallback: AdminOrder): Promise<AdminOrder> {
  return (await findOrder(orderId)) ?? fallback;
}

async function ensureOrderStockLines(order: AdminOrder, quote: CheckoutQuote): Promise<AdminOrder> {
  if (order.stockLines && order.stockLines.length > 0) {
    return order;
  }
  const stockLines = stockLinesFromCheckout(quote.lines);
  const { order: patched } = await patchOrder(order.id, () => ({ stockLines }));
  return patched ?? { ...order, stockLines };
}

async function applyAddressReviewIfMissing(
  order: AdminOrder,
  payment: VerifiedPayPalPayment,
): Promise<AdminOrder> {
  const address = payment.shippingAddress?.trim() || order.shippingAddress?.trim() || "";
  if (!isShippingAddressMissing(address)) {
    return order;
  }

  const { order: patched, changed } = await patchOrder(order.id, (current) =>
    patchForReviewReason(current, "adresse"),
  );
  if (changed) {
    deferAfter(() => {
      void sendOpsAlertOnce(`address-missing:${payment.orderId}`, "Adresse livraison absente", {
        orderId: payment.orderId,
        reason: "capture OK mais adresse PayPal vide — commande bloquée",
      });
    });
  }
  return reloadOrder(order.id, patched ?? order);
}

async function finalizeStockThenAddressReview(
  order: AdminOrder,
  payment: VerifiedPayPalPayment,
): Promise<AdminOrder> {
  let current = order;
  if (current.stockPending && !current.stockApplied) {
    current = await finalizeOrderStock(current);
  }
  current = await applyAddressReviewIfMissing(current, payment);
  return reloadOrder(current.id, current);
}

async function returnPaidOrder(
  order: AdminOrder,
  quote: CheckoutQuote,
  payment: VerifiedPayPalPayment,
): Promise<AdminOrder> {
  const withLines = await ensureOrderStockLines(order, quote);
  return finalizeStockThenAddressReview(withLines, payment);
}

async function finalizeNewOrder(
  order: AdminOrder,
  payment: VerifiedPayPalPayment,
): Promise<AdminOrder> {
  return finalizeStockThenAddressReview(order, payment);
}

export async function persistPayPalPayment(
  payment: VerifiedPayPalPayment,
  quote: CheckoutQuote,
): Promise<{ ok: true; order: AdminOrder } | { ok: false; status: 409 | 503; error: string }> {
  const total = payment.totalCents / 100;
  const stockLines = stockLinesFromCheckout(quote.lines);
  const existing = await findOrder(payment.orderId);
  if (existing) {
    if (!orderMatches(existing, payment, total)) {
      return { ok: false, status: 409, error: "Cette commande est déjà enregistrée." };
    }
    const order = await returnPaidOrder(existing, quote, payment);
    await clearPayPalPaymentOrphan(payment.orderId);
    return { ok: true, order };
  }

  const claim = await claimPayPalOrder(payment.orderId);
  if (claim.status === "unavailable") {
    return { ok: false, status: 503, error: "Enregistrement indisponible." };
  }
  if (claim.status === "duplicate") {
    const again = await findOrder(payment.orderId);
    if (again && orderMatches(again, payment, total)) {
      const order = await returnPaidOrder(again, quote, payment);
      await clearPayPalPaymentOrphan(payment.orderId);
      return { ok: true, order };
    }
    const marker = await readPayPalOrderMarker(payment.orderId);
    if (marker === "in_progress") {
      return {
        ok: false,
        status: 503,
        error: PAYPAL_ORDER_FINALIZING_MESSAGE,
      };
    }
    if (marker === "done") {
      logPayPalPersist("marqueur done sans commande", payment.orderId);
      return { ok: false, status: 503, error: "Enregistrement indisponible." };
    }
    logPayPalPersist("claim duplicate sans commande (verrou expiré)", payment.orderId);
    return { ok: false, status: 503, error: "Enregistrement indisponible." };
  }

  const { token } = claim;
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
    stockLines,
    stockPending: true,
    stockApplied: false,
    ...(payment.shippingName ? { shippingName: payment.shippingName } : {}),
    ...(payment.shippingAddress ? { shippingAddress: payment.shippingAddress } : {}),
  };

  try {
    const inserted = await insertOrderIfNew(order);
    if (!inserted) {
      const again = await findOrder(payment.orderId);
      if (again && orderMatches(again, payment, total)) {
        if (!(await completePayPalOrder(payment.orderId, token))) {
          logPayPalPersist("marqueur Redis absent après insert existant", payment.orderId);
        }
        const finalized = await returnPaidOrder(again, quote, payment);
        await clearPayPalPaymentOrphan(payment.orderId);
        return { ok: true, order: finalized };
      }
      logPayPalPersist("insert refusé, capture ou total différent", payment.orderId);
      await releasePayPalOrder(payment.orderId, token);
      return { ok: false, status: 409, error: "Cette commande est déjà enregistrée." };
    }

    if (!(await completePayPalOrder(payment.orderId, token))) {
      logPayPalPersist("marqueur Redis absent après insert", payment.orderId);
    }

    const saved = await findOrder(payment.orderId);
    const base = saved ?? order;
    const finalized = await finalizeNewOrder(base, payment);
    await clearPayPalPaymentOrphan(payment.orderId);
    return { ok: true, order: finalized };
  } catch (error) {
    await releasePayPalOrder(payment.orderId, token);
    if (error instanceof StoreConflictError) {
      logPayPalPersist("conflit store", payment.orderId);
      return { ok: false, status: 503, error: "Enregistrement indisponible." };
    }
    throw error;
  }
}
