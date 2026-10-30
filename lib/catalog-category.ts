/** Slugs catalogue boutique. Le CRM garde ses libellés (`Tee`, `Hoodie`…) : on normalise ici. */
export const CATALOG_CATEGORIES = [
  "t-shirts",
  "hoodies",
  "sweats",
  "caps",
  "jersey",
  "hoodie-zip",
  "pants",
  "crop-top",
] as const;

export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number];
export type CatalogFilter = "all" | CatalogCategory;

const CATEGORY_SET = new Set<string>(CATALOG_CATEGORIES);

const ALIASES: Record<string, CatalogCategory> = {
  "t-shirts": "t-shirts",
  "t-shirt": "t-shirts",
  tee: "t-shirts",
  hoodie: "hoodies",
  hoodies: "hoodies",
  sweat: "sweats",
  sweats: "sweats",
  caps: "caps",
  cap: "caps",
  jersey: "jersey",
  "hoodie zippe": "hoodie-zip",
  "hoodie-zip": "hoodie-zip",
  zip: "hoodie-zip",
  pants: "pants",
  "crop top": "crop-top",
  "crop-top": "crop-top",
};

function slugKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** `null` = catégorie absente ou inconnue (produit orphelin, visible seulement dans Tout). */
export function normalizeCatalogCategory(value: unknown): CatalogCategory | null {
  if (typeof value !== "string") return null;
  const key = slugKey(value);
  if (!key) return null;
  return ALIASES[key] ?? (CATEGORY_SET.has(key) ? (key as CatalogCategory) : null);
}

export function parseCatalogFilter(value: string | null | undefined): CatalogFilter {
  if (!value) return "all";
  const key = slugKey(value);
  if (key === "all" || key === "tout") return "all";
  return normalizeCatalogCategory(value) ?? "all";
}

export const CATALOG_FILTERS: readonly CatalogFilter[] = ["all", ...CATALOG_CATEGORIES];

export const CATALOG_FILTER_LABEL: Record<CatalogFilter, string> = {
  all: "Tout",
  "t-shirts": "T-shirts",
  hoodies: "Hoodie",
  sweats: "Sweats",
  caps: "Caps",
  jersey: "Jersey",
  "hoodie-zip": "Zip",
  pants: "Pants",
  "crop-top": "Crop Top",
};

export function filterByCategory<T extends { category: string }>(
  products: readonly T[],
  selected: CatalogFilter,
): T[] {
  if (selected === "all") return [...products];
  return products.filter((product) => normalizeCatalogCategory(product.category) === selected);
}
