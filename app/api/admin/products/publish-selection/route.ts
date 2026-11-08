import { revalidateShopCatalog } from "@/lib/revalidate-shop-catalog";
import { requireAdmin } from "@/lib/admin/auth";
import {
  publishAdminProductsToLive,
  StoreConflictError,
  StoreUnavailableError,
} from "@/lib/admin/store";
import { jsonNoStore } from "@/lib/http";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonNoStore({ error: "Corps JSON invalide." }, { status: 400 });
  }

  if (!Array.isArray(body.productIds)) {
    return jsonNoStore({ error: "Liste productIds requise." }, { status: 400 });
  }

  const productIds = body.productIds
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  if (productIds.length === 0) {
    return jsonNoStore({ error: "Aucun produit sélectionné." }, { status: 400 });
  }

  try {
    const result = await publishAdminProductsToLive(productIds);
    if (!result) {
      return jsonNoStore({ error: "Mise en ligne impossible." }, { status: 400 });
    }
    if (result.publishedIds.length === 0) {
      const detail =
        result.skipped.length > 0
          ? result.skipped.map((item) => `${item.id}: ${item.reason}`).join(" · ")
          : "Aucun brouillon publiable.";
      return jsonNoStore({ error: detail, skipped: result.skipped }, { status: 409 });
    }
    revalidateShopCatalog();
    return jsonNoStore({
      products: result.products,
      publishedIds: result.publishedIds,
      skipped: result.skipped,
    });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      return jsonNoStore({ error: "Enregistrement indisponible." }, { status: 503 });
    }
    if (error instanceof StoreConflictError) {
      return jsonNoStore({ error: "Conflit d'enregistrement. Réessayez." }, { status: 503 });
    }
    console.error("Publication sélection", error instanceof Error ? error.name : "erreur");
    return jsonNoStore({ error: "Mise en ligne impossible." }, { status: 500 });
  }
}
