"use client";

import { OrderFulfillmentControls } from "@/components/molecules/order-fulfillment-controls";
import { formatDate, formatPrice } from "@/lib/admin/format";
import type { OrderStatus } from "@/lib/admin/types";
import { formatCustomerPhoneDisplay } from "@/lib/checkout-phone";
import type { AdminOrder } from "@/lib/admin/types";
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
}: OrdersTabProps) {
  return (
    <div>
      {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}
      <div className="border border-white/10">
        {orders.length === 0 ? (
          <p className="px-4 py-10 text-sm text-white/40">Aucune commande PayPal.</p>
        ) : (
          orders.map((order) => {
            const stock = stockLabel(order);
            return (
              <article key={order.id} className="border-b border-white/[0.06] px-4 py-5 last:border-b-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-white">{order.customerName}</p>
                    <p className="mt-1 text-sm text-white/55">{order.email}</p>
                    {order.customerPhone ? (
                      <p className="mt-1 text-sm text-white/55">
                        {formatCustomerPhoneDisplay(order.customerPhone)}
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
                    <p className="text-sm font-medium">{formatPrice(order.total)}</p>
                    <div className="mt-2">
                      <OrderFulfillmentControls
                        order={order}
                        busy={busyOrderId === order.id}
                        onCycle={() => onCycleStatus(order)}
                        onSetStatus={(status) => onSetStatus(order, status)}
                        onSaveTracking={(tracking) => onSaveTracking(order, tracking)}
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
                            className="h-8 border border-amber-500/35 px-2 text-[9px] uppercase tracking-[0.14em] text-amber-200/90 disabled:opacity-30"
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
                </p>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
