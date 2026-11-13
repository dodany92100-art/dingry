import type { AdminOrder, AdminProduct, OrderStatus } from "@/lib/admin/types";

const STATUS_RANK: Record<OrderStatus, number> = {
  "À vérifier": -1,
  Payée: 0,
  "En préparation": 1,
  Expédiée: 2,
  Livrée: 3,
};

export const LOW_STOCK_THRESHOLD = 3;

/** Commandes PayPal uniquement : tri par statut (À vérifier d'abord), puis date décroissante. */
export function selectPaypalOrders(orders: AdminOrder[]): AdminOrder[] {
  return orders
    .filter((order) => order.source === "paypal")
    .sort(
      (a, b) =>
        STATUS_RANK[a.status] - STATUS_RANK[b.status] || b.createdAt.localeCompare(a.createdAt),
    );
}

export function countPendingShipments(paypalOrders: AdminOrder[]): number {
  return paypalOrders.filter((order) => order.status === "Payée" || order.status === "En préparation").length;
}

export function countStockPending(orders: AdminOrder[]): number {
  return orders.filter((order) => order.stockPending && !order.stockApplied).length;
}

export function countLowStock(products: AdminProduct[]): number {
  return products.filter((product) => product.stock <= LOW_STOCK_THRESHOLD).length;
}

export function sumProductStock(products: readonly AdminProduct[]): number {
  return products.reduce((total, product) => total + Math.max(0, Math.floor(product.stock)), 0);
}
