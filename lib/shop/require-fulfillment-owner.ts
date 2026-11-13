import { jsonNoStore } from "@/lib/http";
import { isFulfillmentOwnerEmail } from "@/lib/shop/fulfillment-owner";
import { shopBearerAccessToken, shopUserFromAccessToken } from "@/lib/supabase/shop-request-user";

export async function requireFulfillmentOwner(request: Request) {
  const token = shopBearerAccessToken(request);
  if (!token) {
    return { user: null, response: jsonNoStore({ error: "Connexion requise." }, { status: 401 }) };
  }
  const user = await shopUserFromAccessToken(token);
  if (!user?.email) {
    return { user: null, response: jsonNoStore({ error: "Session invalide." }, { status: 401 }) };
  }
  if (!isFulfillmentOwnerEmail(user.email)) {
    return { user: null, response: jsonNoStore({ error: "Accès réservé." }, { status: 403 }) };
  }
  return { user, response: null };
}
