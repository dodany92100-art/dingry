"use client";

import { OrderFulfillmentControls } from "@/components/molecules/order-fulfillment-controls";
import { formatDate, formatPrice } from "@/lib/admin/format";
import type { OrderStatus } from "@/lib/admin/types";
import { customerPhoneTelHref, formatCustomerPhoneDisplay } from "@/lib/checkout-phone";
import type { AdminOrder } from "@/lib/admin/types";
import { plannedShippingForOrder } from "@/lib/admin/planned-shipping";
import { formatReviewReasons, isShippingAddressMissing, type OrderReviewReason } from "@/lib/order-review";

type OrdersTabProps = {
  /** Déjà filtrées (PayPal) et triées (voir selectPaypalOrders). */
  orders: AdminOrder[];
  busyOrderId: string | null;
  error: string;
  onCycleStatus: (order: AdminOrder) => void;
  onSetStatus: (order: AdminOrder, status: OrderStatus) => void;
  onSaveTracking: (order: AdminOrder, trackingNumber: string) => void;
  onResolveReview: (order: AdminOrder, reason: OrderReviewReason) => void;
  onResendConfirmation: (order: AdminOrder) => void;
};

const RESOLVE_LABEL: Record<OrderReviewReason, string> = {
  stock: "Lever · stock",
  adresse: "Lever · adresse",
};

function canResolveReason(order: AdminOrder, reason: OrderReviewReason): boolean {
  if (reason === "stock") return Boolean(order.stockApplied);
  if (reason === "adresse") return !isShippingAddressMissing(order.shippingAddress);
  return false;
}

function stockLabel(order: AdminOrder): string | null {
  if (order.stockApplied) return "Stock · décrémenté";
  if (order.stockPending) return "Stock · en attente";
  return null;
}

export function OrdersTab({
  orders,
  busyOrderId,
  error,
  onCycleStatus,
  onSetStatus,
  onSaveTracking,
  onResolveReview,
  onResendConfirmation,
}: OrdersTabProps) {
  const errorIsSuccess = error.startsWith("Confirmation renvoyée");
  return (
    <div>
      {error ? (
        <p className={`mb-3 text-sm ${errorIsSuccess ? "text-emerald-300" : "text-red-400"}`}>{error}</p>
      ) : null}
      <div className="flex flex-col gap-3 sm:gap-3.5">
        {orders.length === 0 ? (
          <p className="rounded-2xl border border-white/10 px-4 py-10 text-sm text-white/40">
            Aucune commande PayPal.
          </p>
        ) : (
          orders.map((order, index) => {
            const stock = stockLabel(order);
            const shippingPlanned = plannedShippingForOrder(order);
            const zebra = index % 2 === 1;
            return (
              <article
                key={order.id}
                className={`rounded-2xl border px-4 py-5 sm:rounded-3xl sm:px-5 sm:py-5 ${
                  zebra
                    ? "border-white/12 bg-white/[0.055] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    : "border-white/[0.08] bg-white/[0.018] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-white">{order.customerName}</p>
                    <p className="mt-1 text-sm">
                      <a
                        href={`mailto:${encodeURIComponent(order.email)}`}
                        className="text-violet-200/90 underline decoration-violet-400/40 underline-offset-2 hover:text-violet-100"
                      >
                        {order.email}
                      </a>
                    </p>
                    {order.customerPhone ? (
                      <p className="mt-1 text-sm">
                        <a
                          href={customerPhoneTelHref(order.customerPhone)}
                          className="text-violet-200/90 underline decoration-violet-400/40 underline-offset-2 hover:text-violet-100"
                        >
                          {formatCustomerPhoneDisplay(order.customerPhone)}
                        </a>
                      </p>
                    ) : null}
                    <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/30">
                      {formatDate(order.createdAt)}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/30">
                      PayPal {order.id}
                      {order.captureId ? ` · ${order.captureId}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums">{formatPrice(order.total)}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/40">
                      Payé PayPal · articles
                    </p>
                    {shippingPlanned.amountEur !== null ? (
                      <p
                        className="mt-1 text-[10px] uppercase tracking-[0.12em] text-sky-200/85"
                        title="Frais de port prévus (non inclus dans le total PayPal actuel)"
                      >
                        Livraison prévue · {formatPrice(shippingPlanned.amountEur)} ·{" "}
                        {shippingPlanned.tierLabel}
                        {shippingPlanned.amountEur > 0 ? (
                          <span className="text-white/35">
                            {" "}
                            · expédition ~{" "}
                            {formatPrice(order.total + shippingPlanned.amountEur)}
                          </span>
                        ) : null}
                      </p>
                    ) : (
                      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/40">
                        Livraison prévue · tarif à confirmer
                      </p>
                    )}
                    <div className="mt-2">
                      <OrderFulfillmentControls
                        order={order}
                        busy={busyOrderId === order.id}
                        onCycle={() => onCycleStatus(order)}
                        onSetStatus={(status) => onSetStatus(order, status)}
                        onSaveTracking={(tracking) => onSaveTracking(order, tracking)}
                        onResendConfirmation={() => onResendConfirmation(order)}
                      />
                    </div>
                    {order.reviewReasons?.length ? (
                      <p className="mt-2 text-[10px] tracking-[0.12em] text-amber-200/80 uppercase">
                        Motif · {formatReviewReasons(order.reviewReasons)}
                      </p>
                    ) : null}
                    {order.reviewReasons?.length ? (
                      <div className="mt-2 flex flex-wrap justify-end gap-1.5">
                        {order.reviewReasons.map((reason) => (
                          <button
                            key={reason}
                            type="button"
                            disabled={
                              busyOrderId === order.id || !canResolveReason(order, reason)
                            }
                            onClick={() => onResolveReview(order, reason)}
                            className="h-8 rounded-full border border-amber-500/35 px-2.5 text-[9px] uppercase tracking-[0.14em] text-amber-200/90 disabled:opacity-30"
                          >
                            {RESOLVE_LABEL[reason]}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {stock ? (
                      <p
                        className={`mt-2 text-[10px] tracking-[0.12em] uppercase ${
                          order.stockApplied ? "text-white/30" : "text-amber-400/90"
                        }`}
                      >
                        {stock}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 text-sm text-white/70">
                  {order.items.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/55">
                  {order.shippingName ?? order.customerName}
                  <br />
                  {order.shippingAddress || "Adresse manquante"}
                  {shippingPlanned.amountEur !== null ? (
                    <>
                      <br />
                      <span className="text-[10px] uppercase tracking-[0.12em] text-sky-200/70">
                        Port futur · {formatPrice(shippingPlanned.amountEur)} ({shippingPlanned.tierLabel})
                      </span>
                    </>
                  ) : null}
                </p>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
