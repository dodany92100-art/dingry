/** Catégories produit officielles DINGRY (CRM + fiches statiques). */
export const OFFICIAL_PRODUCT_CATEGORIES = [
  "Hoodies",
  "Hoodies zippés",
  "Crewnecks",
  "T-shirts",
  "Jerseys",
  "Pants",
  "Crop tops",
  "Caps",
] as const;

export type OfficialProductCategory = (typeof OFFICIAL_PRODUCT_CATEGORIES)[number];

/** Navigation admin : Collection = vue globale (pas de valeur CRM sur les fiches). */
export const ADMIN_PRODUCT_CATEGORY_NAV = ["Collection", ...OFFICIAL_PRODUCT_CATEGORIES] as const;

export type AdminProductCategoryFilter = (typeof ADMIN_PRODUCT_CATEGORY_NAV)[number];

export function isOfficialProductCategory(value: string): value is OfficialProductCategory {
  return (OFFICIAL_PRODUCT_CATEGORIES as readonly string[]).includes(value);
}
