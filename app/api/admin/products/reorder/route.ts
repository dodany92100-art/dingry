import { revalidateShopCatalog } from "@/lib/revalidate-shop-catalog";
import { requireAdmin } from "@/lib/admin/auth";
import {
  reorderAdminProductDisplay,
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

  if (!Array.isArray(body.orderedIds)) {
    return jsonNoStore({ error: "Liste orderedIds requise." }, { status: 400 });
  }

  const orderedIds = body.orderedIds
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  if (orderedIds.length === 0) {
    return jsonNoStore({ error: "Liste orderedIds vide." }, { status: 400 });
  }

  try {
    const products = await reorderAdminProductDisplay(orderedIds);
    if (!products) {
      return jsonNoStore({ error: "Réordonnancement impossible." }, { status: 400 });
    }
    revalidateShopCatalog();
    return jsonNoStore({ products });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      return jsonNoStore({ error: "Enregistrement indisponible." }, { status: 503 });
    }
    if (error instanceof StoreConflictError) {
      return jsonNoStore({ error: "Conflit d'enregistrement. Réessayez." }, { status: 503 });
    }
    console.error("Réordonnancement produits", error instanceof Error ? error.name : "erreur");
    return jsonNoStore({ error: "Impossible de réordonner." }, { status: 500 });
  }
}
