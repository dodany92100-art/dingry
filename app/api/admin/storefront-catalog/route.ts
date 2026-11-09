import { requireAdmin } from "@/lib/admin/auth";
import { loadStoreReadOnly, StoreUnavailableError } from "@/lib/admin/store";
import { buildStorefrontOnlineProducts } from "@/lib/admin/storefront-online-catalog";
import { jsonNoStore } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const store = await loadStoreReadOnly();
    const products = buildStorefrontOnlineProducts(store);
    const ghostCount = products.filter((product) => product.ghost).length;
    return jsonNoStore({ products, ghostCount });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      return jsonNoStore({ error: "Catalogue indisponible." }, { status: 503 });
    }
    console.error("[admin] storefront-catalog", error instanceof Error ? error.message : "erreur");
    return jsonNoStore({ error: "Catalogue indisponible." }, { status: 500 });
  }
}
