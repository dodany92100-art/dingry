import { loadStoreReadOnly, patchOrder } from "@/lib/admin/store";
import type { AdminOrder, OrderStatus } from "@/lib/admin/types";
import { customerEmailUsable, normalizeCustomerEmail } from "@/lib/auth/customer-email";
import { customerOrderStatusLabel } from "@/lib/admin/order-status";

export type ShopCustomerOrder = {
  id: string;
  status: OrderStatus;
  statusLabel: string;
  total: number;
  items: string[];
  createdAt: string;
  shippingName?: string;
  shippingAddress?: string;
  trackingNumber?: string;
};

function belongsToCustomer(order: AdminOrder, userId: string, email: string): boolean {
  if (order.source !== "paypal") return false;
  if (order.supabaseUserId === userId) return true;
  if (!customerEmailUsable(order.email)) return false;
  return normalizeCustomerEmail(order.email) === email;
}

function toShopCustomerOrder(order: AdminOrder): ShopCustomerOrder {
  return {
    id: order.id,
    status: order.status,
    statusLabel: customerOrderStatusLabel(order.status),
    total: order.total,
    items: [...order.items],
    createdAt: order.createdAt,
    ...(order.shippingName ? { shippingName: order.shippingName } : {}),
    ...(order.shippingAddress ? { shippingAddress: order.shippingAddress } : {}),
    ...(order.trackingNumber ? { trackingNumber: order.trackingNumber } : {}),
  };
}

/** Renseigne `supabaseUserId` sur les commandes PayPal partageant l'e-mail (reconnexion Google / magic link). */
export async function reconcileCustomerOrderUserIds(userId: string, rawEmail: string): Promise<void> {
  const email = normalizeCustomerEmail(rawEmail);
  if (!email) return;
  const store = await loadStoreReadOnly();
  const pending = store.orders.filter(
    (order) =>
      order.source === "paypal" &&
      !order.supabaseUserId &&
      customerEmailUsable(order.email) &&
      normalizeCustomerEmail(order.email) === email,
  );
  await Promise.all(
    pending.map((order) =>
      patchOrder(order.id, () => ({
        supabaseUserId: userId,
      })),
    ),
  );
}

export async function listShopCustomerOrders(userId: string, rawEmail: string): Promise<ShopCustomerOrder[]> {
  const email = normalizeCustomerEmail(rawEmail);
  if (!email) return [];

  await reconcileCustomerOrderUserIds(userId, email);

  const store = await loadStoreReadOnly();
  return store.orders
    .filter((order) => belongsToCustomer(order, userId, email))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toShopCustomerOrder);
}
