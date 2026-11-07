import { normalizeProductCategory, type AdminProduct, type ProductCategory } from "@/lib/admin/types";
import { normalizeCatalogCategory, type CatalogCategory } from "@/lib/catalog-category";
import type { ShopProduct } from "@/lib/catalog";
import { resolveShopCategory } from "@/lib/shop-catalog";

export function normalizeDisplayOrder(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

export function normalizeIsPinned(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

/** Même logique de tie-break que {@link compareShopFeaturedDisplay} (id numérique décroissant). */
function compareAdminProductIds(a: AdminProduct, b: AdminProduct): number {
  const idA = Number(a.id);
  const idB = Number(b.id);
  if (Number.isInteger(idA) && Number.isInteger(idB) && idA > 0 && idB > 0) {
    return idB - idA;
  }
  return a.id.localeCompare(b.id);
}

/** Ordre CRM aligné boutique « Sélection » : épinglés → displayOrder → date → id. */
export function compareAdminProductDisplay(a: AdminProduct, b: AdminProduct): number {
  if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
  const orderDiff = a.displayOrder - b.displayOrder;
  if (orderDiff !== 0) return orderDiff;
  const dateDiff = b.createdAt.localeCompare(a.createdAt);
  if (dateDiff !== 0) return dateDiff;
  return compareAdminProductIds(a, b);
}

/** Alias explicite pour l’onglet Stock (miroir vitrine). */
export const compareAdminProductLikeShop = compareAdminProductDisplay;

export function sortAdminProductsLikeShop(products: readonly AdminProduct[]): AdminProduct[] {
  return sortAdminProductsForDisplay(products);
}

export function sortAdminProductsForDisplay(products: readonly AdminProduct[]): AdminProduct[] {
  return [...products].sort(compareAdminProductDisplay);
}

/** Épinglés en tête, puis date de création strictement décroissante (sans displayOrder). */
export function compareAdminProductNewest(a: AdminProduct, b: AdminProduct): number {
  if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
  const dateDiff = b.createdAt.localeCompare(a.createdAt);
  if (dateDiff !== 0) return dateDiff;
  return a.id.localeCompare(b.id);
}

export function sortAdminProductsNewest(products: readonly AdminProduct[]): AdminProduct[] {
  return [...products].sort(compareAdminProductNewest);
}

const CRM_CATEGORY_SLUG: Record<ProductCategory, CatalogCategory> = {
  Hoodies: "hoodies",
  "Hoodies zippés": "hoodie-zip",
  Crewnecks: "sweats",
  "T-shirts": "t-shirts",
  Jerseys: "jersey",
  Pants: "pants",
  "Crop tops": "crop-top",
  Caps: "caps",
};

export function catalogSlugForAdminProduct(product: AdminProduct): CatalogCategory | null {
  const id = Number(product.id);
  const shopCategory = resolveShopCategory(Number.isInteger(id) ? id : 0, product.category);
  return normalizeCatalogCategory(shopCategory) ?? normalizeCatalogCategory(product.category);
}

export function adminCategoryScope(
  product: AdminProduct,
  filter: ProductCategory | "Collection",
): boolean {
  if (filter === "Collection") return true;
  const targetSlug = CRM_CATEGORY_SLUG[filter];
  const productSlug = catalogSlugForAdminProduct(product);
  if (targetSlug && productSlug) return productSlug === targetSlug;
  return normalizeProductCategory(product.category) === filter;
}

/** Applique une séquence d’ids (vue admin filtrée) sur displayOrder. */
export function applyDisplayOrderByIds(
  products: readonly AdminProduct[],
  orderedIds: readonly string[],
): AdminProduct[] {
  const rank = new Map(orderedIds.map((id, index) => [id, index]));
  return products.map((product) => {
    const nextOrder = rank.get(product.id);
    if (nextOrder === undefined) return product;
    if (product.displayOrder === nextOrder) return product;
    return { ...product, displayOrder: nextOrder };
  });
}

/** Ordre boutique (grille « Sélection » / featured). */
export function compareShopFeaturedDisplay(a: ShopProduct, b: ShopProduct): number {
  const pinA = a.isPinned === true;
  const pinB = b.isPinned === true;
  if (pinA !== pinB) return pinA ? -1 : 1;
  const orderDiff = (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
  if (orderDiff !== 0) return orderDiff;
  const dateA = a.adminCreatedAt ?? "";
  const dateB = b.adminCreatedAt ?? "";
  if (dateA && dateB) {
    const dateDiff = dateB.localeCompare(dateA);
    if (dateDiff !== 0) return dateDiff;
  }
  return b.id - a.id;
}

export function sortShopProductsFeatured(products: readonly ShopProduct[]): ShopProduct[] {
  return [...products].sort(compareShopFeaturedDisplay);
}
