import { unstable_cache } from "next/cache";
import { loadStoreReadOnly } from "@/lib/admin/store";
import { toCatalogProduct } from "@/lib/admin/types";

export const SHOP_CATALOG_CACHE_TAG = "dingry-shop-catalog";

type CachedCatalogRows = {
  products: NonNullable<ReturnType<typeof toCatalogProduct>>[];
  removedCatalogIds: number[];
};

async function loadCatalogProductRows(): Promise<CachedCatalogRows> {
  const store = await loadStoreReadOnly();
  const products = store.products
    .map((product) => toCatalogProduct(product))
    .filter((product): product is NonNullable<ReturnType<typeof toCatalogProduct>> => product !== null);
  const removedCatalogIds = (store.removedCatalogIds ?? [])
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id));
  return { products, removedCatalogIds };
}

/** Produits CRM / Supabase — invalidé par `revalidateShopCatalog()` (mutation admin). */
export const getCachedCatalogProductRows = unstable_cache(
  loadCatalogProductRows,
  ["dingry-public-catalog-rows-v1"],
  { tags: [SHOP_CATALOG_CACHE_TAG] },
);
