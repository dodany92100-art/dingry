"use client";

import Link from "next/link";
import { OrderFulfillmentControls } from "@/components/molecules/order-fulfillment-controls";
import { formatDate, formatPrice } from "@/lib/admin/format";
import { useFulfillmentOrders } from "@/hooks/use-fulfillment-orders";
import { useShopAuth } from "@/hooks/use-shop-auth";
import { isFulfillmentOwnerClient } from "@/lib/shop/fulfillment-owner-client";

export default function FulfillmentPage() {
  const shopAuth = useShopAuth();
  const owner = isFulfillmentOwnerClient(shopAuth.user?.email);
  const fulfillment = useFulfillmentOrders(
    shopAuth.session?.access_token ?? null,
    shopAuth.ready && owner,
  );

  if (!shopAuth.ready) {
    return (
      <main className="min-h-dvh bg-[#0a0a0a] px-6 py-16 text-white">
        <p className="text-sm text-white/50">Chargement…</p>
      </main>
    );
  }

  if (!shopAuth.user) {
    return (
      <main className="min-h-dvh bg-[#0a0a0a] px-6 py-16 text-white">
        <h1 className="text-sm font-bold tracking-[0.28em] uppercase">Suivi commandes</h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/55">
          Connectez-vous sur la boutique avec le compte opérateur, puis revenez ici.
        </p>
        <Link href="/websitedx" className="mt-8 inline-block text-[11px] tracking-[0.2em] text-white/70 uppercase">
          Retour boutique
        </Link>
      </main>
    );
  }

  if (!owner) {
    return (
      <main className="min-h-dvh bg-[#0a0a0a] px-6 py-16 text-white">
        <h1 className="text-sm font-bold tracking-[0.28em] uppercase">Accès réservé</h1>
        <p className="mt-4 text-sm text-white/55">Cette page est réservée à l&apos;équipe expédition DINGRY.</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#0a0a0a] px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-sm font-bold tracking-[0.28em] uppercase">Expédition</h1>
          <Link href="/websitedx" className="text-[10px] tracking-[0.18em] text-white/45 uppercase">
            Boutique
          </Link>
        </div>
        <p className="mt-2 text-[11px] text-white/45">{shopAuth.user.email}</p>
        {fulfillment.error ? <p className="mt-4 text-sm text-red-300">{fulfillment.error}</p> : null}
        {fulfillment.loading ? (
          <p className="mt-8 text-sm text-white/45">Chargement des commandes…</p>
        ) : fulfillment.orders.length === 0 ? (
          <p className="mt-8 text-sm text-white/45">Aucune commande PayPal.</p>
        ) : (
          <ul className="mt-8 space-y-5">
            {fulfillment.orders.map((order) => (
              <li key={order.id} className="border border-white/10 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-white">{order.customerName}</p>
                    <p className="mt-1 text-xs text-white/55">{order.email}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/35">
                      {formatDate(order.createdAt)} · {order.id}
                    </p>
                  </div>
                  <p className="text-sm font-medium">{formatPrice(order.total)}</p>
                </div>
                <ul className="mt-3 space-y-1 text-xs text-white/65">
                  {order.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs leading-relaxed text-white/50">{order.shippingAddress || "—"}</p>
                <div className="mt-4">
                  <OrderFulfillmentControls
                    order={order}
                    busy={fulfillment.busyOrderId === order.id}
                    onCycle={() => fulfillment.cycleStatus(order)}
                    onSetStatus={(status) => fulfillment.setStatus(order, status)}
                    onSaveTracking={(tracking) => fulfillment.saveTracking(order, tracking)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}