import {
  CATALOG_CATEGORIES,
  CATALOG_FILTER_LABEL,
  filterByCategory,
  normalizeCatalogCategory,
  type CatalogCategory,
  type CatalogFilter,
} from "@/lib/catalog-category";
import { sortCatalogProducts } from "@/lib/catalog-sort";
import { isVersoCatalogId } from "@/lib/catalog-verso-recto";
import {
  DINGRY_JERSEY_PRODUCT_IDS,
  DINGRY_SWEAT_PRODUCT_IDS,
  DINGRY_TEE_PRODUCT_IDS,
} from "@/lib/dingry-product-media";
import { normalizeProductCategory, type ProductCategory } from "@/lib/admin/types";
import type { ShopProduct } from "@/lib/catalog";

export { filterByCategory, parseCatalogFilter, CATALOG_FILTERS, CATALOG_FILTER_LABEL, CATALOG_MENU_TAB_CUSTOM, CATALOG_MENU_TABS, catalogMenuTabLabel } from "@/lib/catalog-category";
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

/** Onglets catégorie (sans « Tout ») — même ordre que le menu catalogue. */
const SHOP_CATEGORY_BY_MENU_SLUG: Record<CatalogCategory, ShopCategory> = {
  hoodies: "Hoodie",
  "hoodie-zip": "Hoodie zippé",
  sweats: "Sweats",
  "t-shirts": SHOP_TEE_CATEGORY,
  jersey: "Jersey",
  pants: "Pants",
  "crop-top": "Crop Top",
  caps: "Caps",
};

export const SHOP_CATEGORY_TABS = CATALOG_CATEGORIES.map(
  (slug) => SHOP_CATEGORY_BY_MENU_SLUG[slug],
) as readonly ShopCategory[];

/** Barre catalogue : « Tout » + chaque catégorie ci-dessus. */
export const SHOP_CATALOG_TABS = ["Collection", ...SHOP_CATEGORY_TABS] as const;

export type ShopCatalogTab = (typeof SHOP_CATALOG_TABS)[number];

/** Retirés boutique (verso fantômes tees + fiche perso #24 doublon du tee noir #21). */
export const DINGRY_RETIRED_PRODUCT_IDS = new Set([12, 13, 14, 15, 16, 24]);

/** Hoodie Original BLACK #6 masqué seulement si Paris #25 est dans le catalogue live. */
export const DINGRY_HOODIE_BLACK_ORIGINAL_ID = 6;
export const DINGRY_HOODIE_BLACK_PARIS_ID = 25;

export function isActiveShopProduct(product: { id: number }): boolean {
  return !DINGRY_RETIRED_PRODUCT_IDS.has(product.id);
}

export function shopCatalogTabLabel(tab: ShopCatalogTab): string {
  return tab === "Hoodie zippé" ? "Zip" : tab;
}

export function isShopTeeCategory(category: string): boolean {
  return (
    category === "Tee" ||
    category === "T-shirts" ||
    category === SHOP_TEE_CATEGORY
  );
}

export function isShopCategory(category: string): category is ShopCategory {
  return (SHOP_CATEGORY_TABS as readonly string[]).includes(category) || isShopTeeCategory(category);
}

/** Admin → libellé boutique (onglets + filtres). */
export function resolveShopCategory(productId: number, category: string): ShopCategory | string {
  const slug = normalizeCatalogCategory(category);
  if (slug) return SHOP_CATEGORY_BY_MENU_SLUG[slug];
  if (DINGRY_SWEAT_PRODUCT_IDS.has(productId)) return "Sweats";
  if (DINGRY_TEE_PRODUCT_IDS.has(productId)) return SHOP_TEE_CATEGORY;
  if (DINGRY_JERSEY_PRODUCT_IDS.has(productId)) return "Jersey";
  if (category === "Tee" || category === "T-shirts") return SHOP_TEE_CATEGORY;
  return category;
}

export function normalizeAdminCategory(value: string): ProductCategory {
  return normalizeProductCategory(value);
}

/** Cartes grille : hors verso, ids retirés, doublon #6 si #25 présent, une carte par id. */
export function toCatalogCards<T extends { id: number; variant?: string }>(products: readonly T[]): T[] {
  const eligible = products.filter(
    (product) =>
      isActiveShopProduct(product) &&
      !/\bVERSO\b/i.test(product.variant ?? "") &&
      !isVersoCatalogId(product.id),
  );
  const hasParisBlack = eligible.some((product) => product.id === DINGRY_HOODIE_BLACK_PARIS_ID);
  const seenIds = new Set<number>();
  return eligible.filter((product) => {
    if (seenIds.has(product.id)) return false;
    if (product.id === DINGRY_HOODIE_BLACK_ORIGINAL_ID && hasParisBlack) return false;
    seenIds.add(product.id);
    return true;
  });
}

/** Grille : catégorie stricte, puis cartes recto. `all` garde aussi les catégories inconnues. */
export function filterCatalogProducts(
  products: ShopProduct[],
  tab: CatalogFilter,
): ShopProduct[] {
  return toCatalogCards(filterByCategory(products, tab));
}

export type CatalogMenuSection = {
  category: CatalogCategory;
  label: string;
  products: ShopProduct[];
};

/** Blocs Collection visibles même sans fiche (famille lancée progressivement). */
export const CATALOG_SECTION_ALWAYS_VISIBLE = new Set<CatalogCategory>(["pants", "crop-top"]);

function keepCatalogMenuSection(section: CatalogMenuSection): boolean {
  return section.products.length > 0 || CATALOG_SECTION_ALWAYS_VISIBLE.has(section.category);
}

/** Vue « Collection » : blocs produits dans l’ordre du menu (Hoodies → Caps). */
export function buildCatalogMenuSections(products: readonly ShopProduct[]): CatalogMenuSection[] {
  const cards = toCatalogCards(products);
  return CATALOG_CATEGORIES.map((category) => ({
    category,
    label: CATALOG_FILTER_LABEL[category],
    products: sortCatalogProducts(
      cards.filter((product) => normalizeCatalogCategory(product.category) === category),
      "featured",
    ),
  })).filter(keepCatalogMenuSection);
}

/** Fiche produit avec bascule recto / verso (hoodies, sweats ; tees via meta dédiée). */
export function isRectoVersoShopCategory(category: string): boolean {
  const slug = normalizeCatalogCategory(category);
  return slug === "hoodies" || slug === "hoodie-zip" || slug === "sweats";
}
