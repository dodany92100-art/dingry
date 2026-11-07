/** Grille catalogue : 2 col. mobile · 3 col. tablette · 4 col. desktop (vitine e-commerce classique). */
export const CATALOG_GRID_DESKTOP = "md:grid-cols-3 lg:grid-cols-4 lg:gap-5 xl:gap-6";

export const CATALOG_PRODUCT_GRID_CLASS = `mx-auto grid w-full max-w-[1360px] grid-cols-2 gap-3 px-0 sm:gap-4 ${CATALOG_GRID_DESKTOP}`;

/** Surface catalogue boutique (`CatalogSection`). */
export const CATALOG_SECTION_SURFACE_CLASS =
  "dingry-catalog-surface px-4 pb-20 md:px-12 md:pb-24";

/** Compense le padding CRM admin pour caler la grille sur la vitrine. */
export const ADMIN_STOREFRONT_PREVIEW_BLEED_CLASS = "-mx-6 md:-mx-10";

export const CATALOG_SECTION_HEADING_CLASS =
  "border-b border-white/[0.08] pb-3 text-sm font-medium uppercase tracking-[0.28em] text-white md:pb-4 md:text-base";
