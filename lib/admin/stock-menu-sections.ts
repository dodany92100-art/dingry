import type { AdminProduct } from "@/lib/admin/types";
import { CATALOG_CATEGORIES, CATALOG_FILTER_LABEL, type CatalogCategory } from "@/lib/catalog-category";
import { catalogSlugForAdminProduct, sortAdminProductsLikeShop } from "@/lib/admin/product-display-order";
import { CATALOG_SECTION_ALWAYS_VISIBLE, DINGRY_RETIRED_PRODUCT_IDS } from "@/lib/shop-catalog";
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
  return products.filter((product) => {
    if (/\bVERSO\b/i.test(product.variant)) return false;
    const id = Number(product.id);
    if (Number.isInteger(id) && isVersoCatalogId(id)) return false;
    if (Number.isInteger(id) && DINGRY_RETIRED_PRODUCT_IDS.has(id)) return false;
    return true;
  });
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
  })).filter(
    (section) => section.products.length > 0 || CATALOG_SECTION_ALWAYS_VISIBLE.has(section.category),
  );
}
