import { unstable_cache } from "next/cache";
import { loadStoreReadOnly } from "@/lib/admin/store";
import type { toCatalogProduct } from "@/lib/admin/types";
import { publicLiveCatalogRows, removedCatalogIdSet } from "@/lib/shop-catalog-snapshot";

export const SHOP_CATALOG_CACHE_TAG = "dingry-shop-catalog";

type CachedCatalogRows = {
  products: NonNullable<ReturnType<typeof toCatalogProduct>>[];
  removedCatalogIds: number[];
};

async function loadCatalogProductRows(): Promise<CachedCatalogRows> {
  const store = await loadStoreReadOnly();
  const products = publicLiveCatalogRows(store);
  const removedCatalogIds = [...removedCatalogIdSet(store)];
  return { products, removedCatalogIds };
}

/** Produits CRM / Supabase — invalidé par `revalidateShopCatalog()` (mutation admin). */
export const getCachedCatalogProductRows = unstable_cache(
  loadCatalogProductRows,
  ["dingry-public-catalog-rows-v2"],
  { tags: [SHOP_CATALOG_CACHE_TAG] },
);
