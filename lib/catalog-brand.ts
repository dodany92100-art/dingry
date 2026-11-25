import {
  BRANDS,
  DEFAULT_PRODUCT_BRAND,
  DEFAULT_PRODUCT_COLLECTION,
  type Brand,
  type ProductCollection,
} from "@/lib/admin/types";

/** `null` = toutes les marques (« Voir tous »). */
export type CatalogBrandFilter = Brand | null;

export const CATALOG_BRAND_FILTER_ALL = null;

function decodeBrandQueryParam(raw: string): string {
  try {
    return decodeURIComponent(raw.replace(/\+/g, " ")).trim();
  } catch {
    return raw.replace(/\+/g, " ").trim();
  }
}

function brandFromDecoded(decoded: string): Brand | null {
  if (!decoded) return null;
  return (BRANDS as readonly string[]).includes(decoded) ? (decoded as Brand) : null;
}

/** Valeur `?brand=` : marque connue ou `null` (inconnu / absent = « Voir tous »). */
export function parseCatalogBrandFilter(value: string | null | undefined): CatalogBrandFilter {
  if (value == null || !String(value).trim()) return CATALOG_BRAND_FILTER_ALL;
  return brandFromDecoded(decodeBrandQueryParam(String(value)));
}

export function shopProductBrand(product: { brand?: Brand }): Brand {
  return product.brand ?? DEFAULT_PRODUCT_BRAND;
}

export function filterByBrand<T extends { brand?: Brand }>(
  products: readonly T[],
  selected: CatalogBrandFilter,
): T[] {
  if (!selected) return [...products];
  return products.filter((product) => shopProductBrand(product) === selected);
}

export { filterBrandCatalog, filterBrandCatalogExcludingCollection, brandPageVisibleProducts } from "@/lib/filter-brand-catalog";

export function catalogBrandFilterLabel(brand: CatalogBrandFilter): string {
  if (!brand) return "Voir tous";
  return brand;
}

/** Sélecteur boutique : « Voir tous » puis chaque marque fermée. */
export const CATALOG_BRAND_FILTER_VALUES = [CATALOG_BRAND_FILTER_ALL, ...BRANDS] as const;

export function catalogBrandFilterQueryValue(brand: CatalogBrandFilter): string | null {
  return brand;
}

/** Libellé collection sur fiche boutique (masque « Signature »). */
export function storefrontCollectionEyebrow(
  collection: ProductCollection | undefined,
): string | null {
  const value = collection ?? DEFAULT_PRODUCT_COLLECTION;
  if (value === "Signature") return null;
  return value;
}