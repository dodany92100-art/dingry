import {
  filterByCategory,
  normalizeCatalogCategory,
  type CatalogFilter,
} from "@/lib/catalog-category";
import {
  DINGRY_JERSEY_PRODUCT_IDS,
  DINGRY_SWEAT_PRODUCT_IDS,
  DINGRY_TEE_PRODUCT_IDS,
} from "@/lib/dingry-product-media";
import type { ProductCategory } from "@/lib/admin/types";
import type { ShopProduct } from "@/lib/catalog";

export { filterByCategory, parseCatalogFilter, CATALOG_FILTERS, CATALOG_FILTER_LABEL } from "@/lib/catalog-category";
export type { CatalogCategory, CatalogFilter } from "@/lib/catalog-category";

/** Catégories affichées sur une fiche produit boutique. */
export type ShopCategory =
  | "T-shirts"
  | "Hoodie"
  | "Hoodie zippé"
  | "Sweats"
  | "Caps"
  | "Jersey"
  | "Pants"
  | "Crop Top";

export const SHOP_TEE_CATEGORY = "T-shirts" satisfies ShopCategory;

/** Onglets catégorie (sans « Tout ») — une entrée = un filtre boutique. */
export const SHOP_CATEGORY_TABS = [
  "T-shirts",
  "Hoodie",
  "Caps",
  "Sweats",
  "Hoodie zippé",
  "Pants",
  "Jersey",
  "Crop Top",
] as const satisfies readonly ShopCategory[];

/** Barre catalogue : « Tout » + chaque catégorie ci-dessus. */
export const SHOP_CATALOG_TABS = ["Tout", ...SHOP_CATEGORY_TABS] as const;

export type ShopCatalogTab = (typeof SHOP_CATALOG_TABS)[number];

/** Retirés boutique (doublon Collection 05 — même photo que 09). */
export const DINGRY_RETIRED_PRODUCT_IDS = new Set([15, 16]);

export function isActiveShopProduct(product: { id: number }): boolean {
  return !DINGRY_RETIRED_PRODUCT_IDS.has(product.id);
}

export function shopCatalogTabLabel(tab: ShopCatalogTab): string {
  return tab === "Hoodie zippé" ? "Zip" : tab;
}

export function isShopTeeCategory(category: string): boolean {
  return category === "Tee" || category === SHOP_TEE_CATEGORY;
}

export function isShopCategory(category: string): category is ShopCategory {
  return (SHOP_CATEGORY_TABS as readonly string[]).includes(category) || isShopTeeCategory(category);
}

/** Admin → libellé boutique (onglets + filtres). */
export function resolveShopCategory(productId: number, category: string): ShopCategory | string {
  if (DINGRY_SWEAT_PRODUCT_IDS.has(productId)) return "Sweats";
  if (DINGRY_TEE_PRODUCT_IDS.has(productId)) return SHOP_TEE_CATEGORY;
  if (DINGRY_JERSEY_PRODUCT_IDS.has(productId)) return "Jersey";
  if (category === "Tee") return SHOP_TEE_CATEGORY;
  return category;
}

export function normalizeAdminCategory(value: string): ProductCategory {
  const categories: ProductCategory[] = [
    "Tee",
    "Hoodie",
    "Hoodie zippé",
    "Sweats",
    "Caps",
    "Jersey",
  ];
  return categories.includes(value as ProductCategory) ? (value as ProductCategory) : "Tee";
}

/** Cartes grille : hors doublons retirés et hors vues verso. La catégorie ne filtre pas ici. */
export function toCatalogCards<T extends { id: number; variant?: string }>(products: readonly T[]): T[] {
  return products.filter(
    (product) => isActiveShopProduct(product) && !/\bVERSO\b/i.test(product.variant ?? ""),
  );
}

/** Grille : catégorie stricte, puis cartes recto. `all` garde aussi les catégories inconnues. */
export function filterCatalogProducts(
  products: ShopProduct[],
  tab: CatalogFilter,
): ShopProduct[] {
  return toCatalogCards(filterByCategory(products, tab));
}

/** Fiche produit avec bascule recto / verso (hoodies, sweats ; tees via meta dédiée). */
export function isRectoVersoShopCategory(category: string): boolean {
  const slug = normalizeCatalogCategory(category);
  return slug === "hoodies" || slug === "hoodie-zip" || slug === "sweats";
}
