import { StoreUnavailableError } from "@/lib/admin/store";
import { listOrders } from "@/lib/admin/orders";
import { selectPaypalOrders } from "@/lib/admin/order-view";
import { jsonNoStore } from "@/lib/http";
import { requireFulfillmentOwner } from "@/lib/shop/require-fulfillment-owner";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gate = await requireFulfillmentOwner(request);
  if (gate.response) return gate.response;

  try {
    const orders = selectPaypalOrders(await listOrders());
    return jsonNoStore({ orders });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      return jsonNoStore({ error: "Commandes indisponibles." }, { status: 503 });
    }
    console.error("[fulfillment/orders] exception", error instanceof Error ? error.message : "erreur");
    return jsonNoStore({ error: "Commandes indisponibles." }, { status: 503 });
  }
}
