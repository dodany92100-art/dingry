/** Boutique privée teaser (gate admin). */
export const SHOP_PREVIEW_PATH = "/websitedx" as const;

export type ShopBasePath = "/" | typeof SHOP_PREVIEW_PATH;

export function shopBasePathFromPathname(pathname: string): ShopBasePath {
  if (pathname === SHOP_PREVIEW_PATH || pathname.startsWith(`${SHOP_PREVIEW_PATH}/`)) {
    return SHOP_PREVIEW_PATH;
  }
  return "/";
}

/** Routes hors préfixe vitrine (gate / proxy sur chemins racine). */
function isShopRootRoute(path: string): boolean {
  if (path === "/checkout" || path.startsWith("/checkout/")) return true;
  if (path === "/admin" || path.startsWith("/admin/")) return true;
  if (path === "/legal" || path.startsWith("/legal/")) return true;
  return false;
}

/** Racine boutique (`/` → `/websitedx`) ; checkout/legal/admin inchangés. */
export function shopHref(base: ShopBasePath, href: string): string {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("http") || trimmed.startsWith("mailto:") || trimmed.startsWith("#")) {
    return href;
  }
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (isShopRootRoute(path)) return path;
  if (base === "/") return path;
  if (path === "/") return base;
  return `${base}${path}`;
}
