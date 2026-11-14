"use client";

import { shopOrderStatusBadgeClass } from "@/lib/admin/order-status";
import type { ShopCustomerOrder } from "@/lib/shop/customer-orders";

function formatTotal(euros: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(euros);
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(date);
}

type ShopOrderHistoryProps = {
  orders: ShopCustomerOrder[];
  loading: boolean;
  error: string | null;
};

export function ShopOrderHistory({ orders, loading, error }: ShopOrderHistoryProps) {
  if (loading) {
    return <p className="dingry-auth-account-body">Chargement de vos commandes…</p>;
  }
  if (error) {
    return <p className="dingry-auth-account-body text-amber-200/90">{error}</p>;
  }
  if (orders.length === 0) {
    return (
      <p className="dingry-auth-account-body">
        Aucune commande PayPal rattachée à cet e-mail pour le moment. Un achat invité apparaît ici après
        paiement.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <li
          key={order.id}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">{formatDate(order.createdAt)}</p>
              <p className="mt-1 text-xs text-white/80">{formatTotal(order.total)}</p>
            </div>
            <span
              className={`rounded-full border px-2.5 py-1 text-[9px] font-medium tracking-[0.16em] uppercase ${shopOrderStatusBadgeClass(order.status)}`}
            >
              {order.statusLabel}
            </span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-white/45">Réf. {order.id}</p>
          {order.trackingNumber ? (
            <p className="mt-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[10px] text-white/75">
              Suivi colis · <span className="text-white">{order.trackingNumber}</span>
            </p>
          ) : null}
          <ul className="mt-2 space-y-0.5 text-[10px] leading-relaxed text-white/55">
            {order.items.slice(0, 4).map((line) => (
              <li key={`${order.id}-${line}`}>{line}</li>
            ))}
            {order.items.length > 4 ? (
              <li className="text-white/35">+ {order.items.length - 4} article(s)</li>
            ) : null}
          </ul>
        </li>
      ))}
    </ul>
  );
}
