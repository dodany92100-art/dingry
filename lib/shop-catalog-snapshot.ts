import type { AdminProduct, AdminStore } from "@/lib/admin/types";
import { toCatalogProduct } from "@/lib/admin/types";
import { overlayShopCatalog, type ShopProduct } from "@/lib/catalog";
import { PRODUCTS } from "@/lib/shop-data";

export type ShopCatalogSnapshot = {
  shopById: ReadonlyMap<number, ShopProduct>;
  removed: ReadonlySet<number>;
  adminById: ReadonlyMap<number, AdminProduct>;
};

export function removedCatalogIdSet(store: AdminStore): ReadonlySet<number> {
  return new Set(
    (store.removedCatalogIds ?? [])
      .map((id) => Number(id))
      .filter((catalogId) => Number.isInteger(catalogId) && catalogId > 0),
  );
}

export function publicLiveCatalogRows(
  store: AdminStore,
): NonNullable<ReturnType<typeof toCatalogProduct>>[] {
  return store.products
    .map((row) => toCatalogProduct(row))
    .filter((row): row is NonNullable<ReturnType<typeof toCatalogProduct>> => row !== null);
}

function adminProductById(store: AdminStore): ReadonlyMap<number, AdminProduct> {
  const map = new Map<number, AdminProduct>();
  for (const product of store.products) {
    const id = Number(product.id);
    if (Number.isInteger(id) && id > 0) map.set(id, product);
  }
  return map;
}

/** Même surface que la vitrine (`overlayShopCatalog` + tombstones). */
export function buildShopCatalogSnapshot(store: AdminStore): ShopCatalogSnapshot {
  const removed = removedCatalogIdSet(store);
  const live = publicLiveCatalogRows(store);
  const shopById = new Map(
    overlayShopCatalog(PRODUCTS, live, [...removed]).map((product) => [product.id, product]),
  );
  return { shopById, removed, adminById: adminProductById(store) };
}
