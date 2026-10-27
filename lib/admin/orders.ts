import Stripe from "stripe";
import { loadStore } from "@/lib/admin/store";
import type { AdminOrder } from "@/lib/admin/types";

function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

function formatStripeItems(session: Stripe.Checkout.Session): string[] {
  const lineItems = session.line_items?.data ?? [];
  const labels = lineItems.map((item) => {
    const name = item.description?.trim() || "Article DINGRY";
    const quantity = item.quantity && item.quantity > 1 ? ` ×${item.quantity}` : "";
    return `${name}${quantity}`;
  });
  return labels.length > 0 ? labels : ["Commande Stripe"];
}

async function fetchStripeOrders(): Promise<AdminOrder[]> {
  const stripe = getStripe();
  if (!stripe) return [];

  try {
    const sessions = await stripe.checkout.sessions.list({
      limit: 20,
      expand: ["data.line_items"],
    });

    return sessions.data
      .filter((session) => session.status === "complete" || session.payment_status === "paid")
      .map((session) => {
        const details = session.customer_details;
        const email = details?.email || session.customer_email || "—";
        const customerName = details?.name?.trim() || "Client Stripe";
        const total = (session.amount_total ?? 0) / 100;
        return {
          id: session.id,
          customerName,
          email,
          total,
          items: formatStripeItems(session),
          status: "En attente" as const,
          createdAt: new Date((session.created || 0) * 1000).toISOString(),
          source: "stripe" as const,
        };
      });
  } catch {
    return [];
  }
}

export async function listOrders(): Promise<AdminOrder[]> {
  const store = await loadStore();
  const stripeOrders = await fetchStripeOrders();
  const storedById = new Map(store.orders.map((order) => [order.id, order]));
  const merged: AdminOrder[] = [];

  for (const stripeOrder of stripeOrders) {
    const stored = storedById.get(stripeOrder.id);
    merged.push(stored ? { ...stripeOrder, status: stored.status } : stripeOrder);
    storedById.delete(stripeOrder.id);
  }

  for (const order of store.orders) {
    if (storedById.has(order.id)) merged.push(order);
  }

  return merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
