/** Grille catalogue : 2 col. mobile (gap serré) · 3 col. lg+ · admin vitrine dense xl+. */
export const CATALOG_GRID_DENSE_DESKTOP = "xl:grid-cols-4 xl:gap-6 2xl:grid-cols-5";

export const CATALOG_PRODUCT_GRID_CLASS = `grid grid-cols-2 gap-3 px-0 sm:gap-4 lg:grid-cols-3 lg:gap-4 ${CATALOG_GRID_DENSE_DESKTOP}`;

/** Surface catalogue boutique (`CatalogSection`). */
export const CATALOG_SECTION_SURFACE_CLASS =
  "dingry-catalog-surface px-4 pb-20 md:px-12 md:pb-24";

/** Compense le padding CRM admin pour caler la grille sur la vitrine. */
export const ADMIN_STOREFRONT_PREVIEW_BLEED_CLASS = "-mx-6 md:-mx-10";

export const CATALOG_SECTION_HEADING_CLASS =
  "border-b border-white/[0.08] pb-3 text-sm font-medium uppercase tracking-[0.28em] text-white md:pb-4 md:text-base";
