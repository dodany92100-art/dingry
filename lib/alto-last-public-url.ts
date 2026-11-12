import { DINGRY_TEASER_OPENING_AT } from "@/lib/dingry-teaser-opening";
import { SHOP_PREVIEW_PATH } from "@/lib/shop-base-path";

export const ALTO_LAST_PUBLIC_URL_KEY = "alto_last_public_url";

export const ALTO_PUBLIC_FALLBACK_PATH = SHOP_PREVIEW_PATH;

/** Aligné sur `publicHomeMode()` — côté client (session Alto). */
export function isPublicRootTeaserHome(nowMs: number = Date.now()): boolean {
  const mode = (process.env.NEXT_PUBLIC_DINGRY_PUBLIC_HOME ?? process.env.DINGRY_PUBLIC_HOME ?? "")
    .trim()
    .toLowerCase();
  if (mode === "construction") return true;
  if (nowMs < DINGRY_TEASER_OPENING_AT) return true;
  if (mode === "teaser") return true;
  return false;
}

function pathnameOfRelativeUrl(url: string): string {
  const path = url.split("?")[0] ?? "/";
  return path.startsWith("/") ? path : `/${path}`;
}

/** Évite de renvoyer vers `/` (teaser) quand la boutique est sur `/websitedx`. */
export function normalizeAltoPublicUrl(url: string, nowMs: number = Date.now()): string {
  const trimmed = url.trim();
  if (!trimmed.startsWith("/")) return ALTO_PUBLIC_FALLBACK_PATH;
  const path = pathnameOfRelativeUrl(trimmed);
  if (isAdminAppPath(path)) return ALTO_PUBLIC_FALLBACK_PATH;
  if (path === "/" && isPublicRootTeaserHome(nowMs)) {
    const query = trimmed.includes("?") ? trimmed.slice(trimmed.indexOf("?")) : "";
    return query ? `${SHOP_PREVIEW_PATH}${query}` : SHOP_PREVIEW_PATH;
  }
  return trimmed;
}

export function isAdminAppPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/** Chemin + query relatifs (sans origin). */
export function buildRelativeUrl(pathname: string, search: string): string {
  const query = search.startsWith("?") ? search.slice(1) : search;
  return query ? `${pathname}?${query}` : pathname;
}

export function readAltoLastPublicUrl(): string {
  if (typeof sessionStorage === "undefined") return ALTO_PUBLIC_FALLBACK_PATH;
  try {
    const stored = sessionStorage.getItem(ALTO_LAST_PUBLIC_URL_KEY)?.trim();
    if (!stored || !stored.startsWith("/")) return ALTO_PUBLIC_FALLBACK_PATH;
    return normalizeAltoPublicUrl(stored);
  } catch {
    return ALTO_PUBLIC_FALLBACK_PATH;
  }
}

export function saveAltoLastPublicUrl(url: string): void {
  if (typeof sessionStorage === "undefined") return;
  const normalized = normalizeAltoPublicUrl(url);
  if (isAdminAppPath(pathnameOfRelativeUrl(normalized))) return;
  try {
    sessionStorage.setItem(ALTO_LAST_PUBLIC_URL_KEY, normalized);
  } catch {
    /* quota / private mode */
  }
}
