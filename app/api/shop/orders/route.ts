import { StoreUnavailableError } from "@/lib/admin/store";
import { CHECKOUT_CODES, checkoutErrorResponse } from "@/lib/checkout-diagnostic";
import { jsonNoStore } from "@/lib/http";
import { listShopCustomerOrders } from "@/lib/shop/customer-orders";
import { shopBearerAccessToken, shopUserFromAccessToken } from "@/lib/supabase/shop-request-user";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = shopBearerAccessToken(request);
  if (!token) {
    return jsonNoStore({ error: "Connexion requise." }, { status: 401 });
  }

  const user = await shopUserFromAccessToken(token);
  if (!user?.email) {
    return jsonNoStore({ error: "Session invalide." }, { status: 401 });
  }

  try {
    const orders = await listShopCustomerOrders(user.id, user.email);
    return jsonNoStore({ orders });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      return checkoutErrorResponse(CHECKOUT_CODES.STORE, "Commandes momentanément indisponibles.", 503);
    }
    console.error("[shop/orders] exception", error instanceof Error ? error.message : "erreur");
    return jsonNoStore({ error: "Commandes momentanément indisponibles." }, { status: 503 });
  }
}
