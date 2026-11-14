/** Colonne vitrine : contenu centré, fond pleine largeur. */
export const DINGRY_SHOP_SHELL_CLASS =
  "mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8";

/** Conteneur vitrine catalogue (barre filtres + grille), aligné sur la grille 3 col. */
export const CATALOG_VITRINE_SHELL_CLASS = "mx-auto w-full max-w-6xl px-4 max-md:px-0";

/** @deprecated Préférer {@link CATALOG_VITRINE_SHELL_CLASS} */
export const CATALOG_PRODUCT_GRID_SHELL_CLASS = CATALOG_VITRINE_SHELL_CLASS;

/** Grille catalogue : 2 col. mobile · 3 col. tablette/desktop. */
export const CATALOG_PRODUCT_GRID_CLASS =
  "grid w-full grid-cols-2 items-stretch gap-4 sm:gap-5 md:grid-cols-3 md:gap-6 lg:grid-cols-3";

/** CRM stock : 2 col. mobile · densité progressive desktop. */
export const ADMIN_STOCK_PRODUCT_GRID_CLASS =
  "mx-auto grid w-full min-w-0 max-w-[1680px] grid-cols-2 items-stretch gap-2 px-0 sm:grid-cols-3 sm:gap-2.5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7";

/** Surface catalogue boutique (`CatalogSection`). */
export const CATALOG_SECTION_SURFACE_CLASS = "dingry-catalog-surface pb-20 md:pb-24";

/** Compense le padding CRM admin pour caler la grille sur la vitrine. */
export const ADMIN_STOREFRONT_PREVIEW_BLEED_CLASS = "-mx-6 md:-mx-10";

/** Titre de famille catalogue — Anton (display), ancrage scroll sous nav + barre onglets. */
export const CATALOG_SCROLL_OFFSET_CLASS =
  "scroll-mt-[calc(var(--dingry-nav-h)+var(--dingry-catalog-bar-h)+0.75rem)]";

/** Sections plein écran (atelier, heritage…) — calage sous la nav fixe. */
export const DINGRY_SECTION_SCROLL_OFFSET_CLASS = "scroll-mt-[calc(var(--dingry-nav-h)+0.5rem)]";

/** Fond dégradé sombre : heritage → lookbook → pied de page. */
export const DINGRY_SHOP_LOWER_BAND_CLASS = "dingry-shop-lower-band";

export const CATALOG_SECTION_HEADING_CLASS = [
  "dingry-typo-street",
  "dingry-typo-street--md",
  "dingry-gold-rule-bottom",
  CATALOG_SCROLL_OFFSET_CLASS,
  "pb-3 text-white md:pb-4",
].join(" ");
