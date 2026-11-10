/** Grille catalogue : 2 col. mobile · 3 col. tablette · 4 col. desktop (vitine e-commerce classique). */
export const CATALOG_GRID_DESKTOP = "md:grid-cols-3 lg:grid-cols-4 lg:gap-5 xl:gap-6";

export const CATALOG_PRODUCT_GRID_CLASS = `mx-auto grid w-full max-w-[1360px] grid-cols-2 items-stretch gap-3 px-0 sm:gap-4 ${CATALOG_GRID_DESKTOP}`;

/** CRM stock : 2 col. mobile · densité progressive desktop. */
export const ADMIN_STOCK_PRODUCT_GRID_CLASS =
  "mx-auto grid w-full min-w-0 max-w-[1680px] grid-cols-2 items-stretch gap-2 px-0 sm:grid-cols-3 sm:gap-2.5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7";

/** Surface catalogue boutique (`CatalogSection`). */
export const CATALOG_SECTION_SURFACE_CLASS =
  "dingry-catalog-surface px-4 pb-20 md:px-12 md:pb-24";

/** Compense le padding CRM admin pour caler la grille sur la vitrine. */
export const ADMIN_STOREFRONT_PREVIEW_BLEED_CLASS = "-mx-6 md:-mx-10";

export const CATALOG_SECTION_HEADING_CLASS =
  "dingry-gold-rule-bottom pb-3 text-sm font-medium uppercase tracking-[0.28em] text-white md:pb-4 md:text-base";
