import type { AdminProduct } from "@/lib/admin/types";
import { CATALOG_CATEGORIES, CATALOG_FILTER_LABEL, type CatalogCategory } from "@/lib/catalog-category";
import { catalogSlugForAdminProduct, sortAdminProductsLikeShop } from "@/lib/admin/product-display-order";
import {
  DINGRY_HOODIE_BLACK_ORIGINAL_ID,
  DINGRY_HOODIE_BLACK_PARIS_ID,
  DINGRY_RETIRED_PRODUCT_IDS,
} from "@/lib/shop-catalog";
import { isVersoCatalogId } from "@/lib/catalog-verso-recto";

export type AdminStockMenuSection = {
  category: CatalogCategory;
  label: string;
  products: AdminProduct[];
};

/** Slug catalogue boutique pour une fiche CRM (aligné overlay vitrine). */
export function adminProductCatalogSlug(product: AdminProduct): CatalogCategory | null {
  return catalogSlugForAdminProduct(product);
}

/** Même filtre cartes que {@link toCatalogCards} côté boutique (recto uniquement, ids retirés). */
export function adminStockCatalogCards(products: readonly AdminProduct[]): AdminProduct[] {
  const eligible: AdminProduct[] = [];
  for (const product of products) {
    if (/\bVERSO\b/i.test(product.variant)) continue;
    const id = Number(product.id);
    if (Number.isInteger(id) && isVersoCatalogId(id)) continue;
    if (Number.isInteger(id) && DINGRY_RETIRED_PRODUCT_IDS.has(id)) continue;
    eligible.push(product);
  }
  const hasParisBlack = eligible.some((product) => Number(product.id) === DINGRY_HOODIE_BLACK_PARIS_ID);
  const seenIds = new Set<string>();
  const kept: AdminProduct[] = [];
  for (const product of eligible) {
    if (seenIds.has(product.id)) continue;
    const id = Number(product.id);
    if (id === DINGRY_HOODIE_BLACK_ORIGINAL_ID && hasParisBlack) continue;
    seenIds.add(product.id);
    kept.push(product);
  }
  return kept;
}

/** Vue Collection admin : blocs Hoodies → Caps, ordre « Sélection » dans chaque bloc. */
export function buildAdminStockMenuSections(
  products: readonly AdminProduct[],
): AdminStockMenuSection[] {
  const cards = adminStockCatalogCards(products);
  return CATALOG_CATEGORIES.map((category) => ({
    category,
    label: CATALOG_FILTER_LABEL[category],
    products: sortAdminProductsLikeShop(
      cards.filter((product) => adminProductCatalogSlug(product) === category),
    ),
  })).filter((section) => section.products.length > 0);
}
