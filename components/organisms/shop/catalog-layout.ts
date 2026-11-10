/** Colonne vitrine : contenu centré, fond pleine largeur. */
export const DINGRY_SHOP_SHELL_CLASS =
  "mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8";

/** Grille catalogue : 2 col. mobile · 3 tablette · 4 desktop. */
export const CATALOG_PRODUCT_GRID_CLASS =
  "grid w-full grid-cols-2 items-stretch gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5";

/** CRM stock : 2 col. mobile · densité progressive desktop. */
export const ADMIN_STOCK_PRODUCT_GRID_CLASS =
  "mx-auto grid w-full min-w-0 max-w-[1680px] grid-cols-2 items-stretch gap-2 px-0 sm:grid-cols-3 sm:gap-2.5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7";

/** Surface catalogue boutique (`CatalogSection`). */
export const CATALOG_SECTION_SURFACE_CLASS = "dingry-catalog-surface pb-20 md:pb-24";

/** Compense le padding CRM admin pour caler la grille sur la vitrine. */
export const ADMIN_STOREFRONT_PREVIEW_BLEED_CLASS = "-mx-6 md:-mx-10";

export const CATALOG_SECTION_HEADING_CLASS =
  "dingry-gold-rule-bottom pb-3 text-sm font-medium uppercase tracking-[0.28em] text-white md:pb-4 md:text-base";
