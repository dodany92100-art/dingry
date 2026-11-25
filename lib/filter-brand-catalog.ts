import {
  DEFAULT_PRODUCT_COLLECTION,
  type Brand,
  type ProductCollection,
} from "@/lib/admin/types";
import type { ShopProduct } from "@/lib/catalog";
import { filterByBrand } from "@/lib/catalog-brand";
import { visibleCatalogProducts } from "@/lib/shop-view";

export function shopProductCollection(product: { collection?: ProductCollection }): ProductCollection {
  return product.collection ?? DEFAULT_PRODUCT_COLLECTION;
}

/** Filtre boutique : marque obligatoire, collection optionnelle. */
export function filterBrandCatalog(
  products: readonly ShopProduct[],
  brand: Brand,
  collection?: ProductCollection,
): ShopProduct[] {
  const byBrand = filterByBrand(products, brand);
  if (collection === undefined) return byBrand;
  return byBrand.filter((product) => shopProductCollection(product) === collection);
}

/** Utile pour la vitrine DINGRY hors ligne MADA. */
export function filterBrandCatalogExcludingCollection(
  products: readonly ShopProduct[],
  brand: Brand,
  excludeCollection: ProductCollection,
): ShopProduct[] {
  return filterByBrand(products, brand).filter(
    (product) => shopProductCollection(product) !== excludeCollection,
  );
}

export function brandPageVisibleProducts(
  products: ShopProduct[],
  brand: Brand,
  options?: { collection?: ProductCollection; excludeCollection?: ProductCollection },
): ShopProduct[] {
  let scoped: ShopProduct[];
  if (options?.collection !== undefined) {
    scoped = filterBrandCatalog(products, brand, options.collection);
  } else if (options?.excludeCollection !== undefined) {
    scoped = filterBrandCatalogExcludingCollection(products, brand, options.excludeCollection);
  } else {
    scoped = filterByBrand(products, brand);
  }
  return visibleCatalogProducts(scoped, "all");
}