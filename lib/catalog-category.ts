/** Slugs catalogue boutique. Le CRM garde ses libellés (`Tee`, `Hoodie`…) : on normalise ici. */
export const CATALOG_CATEGORIES = [
  "hoodies",
  "hoodie-zip",
  "sweats",
  "t-shirts",
  "jersey",
  "pants",
  "crop-top",
  "caps",
] as const;

export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number];
export type CatalogFilter = "all" | CatalogCategory;

const CATEGORY_SET = new Set<string>(CATALOG_CATEGORIES);

const ALIASES: Record<string, CatalogCategory> = {
  tee: "t-shirts",
  "t shirts": "t-shirts",
  "t-shirts": "t-shirts",
  hoodies: "hoodies",
  hoodie: "hoodies",
  "hoodies zippes": "hoodie-zip",
  "hoodie zippé": "hoodie-zip",
  "hoodie zippe": "hoodie-zip",
  crewnecks: "sweats",
  crewneck: "sweats",
  jerseys: "jersey",
  "crop tops": "crop-top",
  "crop top": "crop-top",
  croptop: "crop-top",
  crop: "crop-top",
  pants: "pants",
  pant: "pants",
  pantalon: "pants",
  pantalons: "pants",
  caps: "caps",
  cap: "caps",
  jersey: "jersey",
  sweat: "sweats",
  sweats: "sweats",
  "hoodie-zip": "hoodie-zip",
  zip: "hoodie-zip",
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
  if (key === "all" || key === "tout" || key === "collection" || key === "custom") return "all";
  return normalizeCatalogCategory(value) ?? "all";
}

export const CATALOG_FILTERS: readonly CatalogFilter[] = ["all", ...CATALOG_CATEGORIES];

/** Onglet menu n°10 — ouvre le configurateur (pas un filtre produit). */
export const CATALOG_MENU_TAB_CUSTOM = "custom" as const;

export const CATALOG_MENU_TABS = [...CATALOG_FILTERS, CATALOG_MENU_TAB_CUSTOM] as const;

export type CatalogMenuTab = (typeof CATALOG_MENU_TABS)[number];

export function catalogMenuTabLabel(tab: string): string {
  if (tab === CATALOG_MENU_TAB_CUSTOM) return "Custom";
  return CATALOG_FILTER_LABEL[parseCatalogFilter(tab)];
}

export const CATALOG_FILTER_LABEL: Record<CatalogFilter, string> = {
  all: "Collection",
  hoodies: "Hoodies",
  "hoodie-zip": "Hoodies zippés",
  sweats: "Crewnecks",
  "t-shirts": "T-shirts",
  jersey: "Jerseys",
  pants: "Pants",
  "crop-top": "Crop tops",
  caps: "Caps",
};

export function filterByCategory<T extends { category: string }>(
  products: readonly T[],
  selected: CatalogFilter,
): T[] {
  if (selected === "all") return [...products];
  return products.filter((product) => normalizeCatalogCategory(product.category) === selected);
}
