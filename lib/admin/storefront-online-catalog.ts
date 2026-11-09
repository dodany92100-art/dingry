import type { AdminStore } from "@/lib/admin/types";
import type { ShopProduct } from "@/lib/catalog";
import { buildShopCatalogSnapshot } from "@/lib/shop-catalog-snapshot";
import { toCatalogCards } from "@/lib/shop-catalog";

export type StorefrontOnlineProduct = ShopProduct & {
  /** Visible boutique mais sans fiche CRM (fallback statique). */
  ghost: boolean;
};

export function buildStorefrontOnlineProducts(store: AdminStore): StorefrontOnlineProduct[] {
  const { shopById } = buildShopCatalogSnapshot(store);
  const crmIds = new Set(
    store.products
      .map((product) => Number(product.id))
      .filter((id) => Number.isInteger(id) && id > 0),
  );
  return toCatalogCards([...shopById.values()]).map((product) => ({
    ...product,
    ghost: !crmIds.has(product.id),
  }));
}
