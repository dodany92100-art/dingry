export const ALTO_LAST_PUBLIC_URL_KEY = "alto_last_public_url";

export const ALTO_PUBLIC_FALLBACK_PATH = "/websitedx";

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
    return stored;
  } catch {
    return ALTO_PUBLIC_FALLBACK_PATH;
  }
}

export function saveAltoLastPublicUrl(url: string): void {
  if (typeof sessionStorage === "undefined") return;
  const trimmed = url.trim();
  if (!trimmed.startsWith("/") || isAdminAppPath(trimmed.split("?")[0] ?? "")) return;
  try {
    sessionStorage.setItem(ALTO_LAST_PUBLIC_URL_KEY, trimmed);
  } catch {
    /* quota / private mode */
  }
}
