/** Gate vitrine/checkout en période teaser — actif par défaut (échec fermé). */
export function isTeaserGateActive(): boolean {
  const raw = process.env.DINGRY_TEASER_GATE?.trim().toLowerCase();
  if (!raw) return true;
  if (raw === "off" || raw === "0" || raw === "false" || raw === "disabled") return false;
  return true;
}

const TEASER_GATED_EXACT = new Set([
  "/websitedx",
  "/checkout",
  "/api/catalog",
  "/api/checkout",
  "/api/lookbook",
  "/api/banners",
  "/api/catalog-perso-banner",
]);

export function isTeaserGatedPath(pathname: string): boolean {
  if (TEASER_GATED_EXACT.has(pathname)) return true;
  if (pathname.startsWith("/checkout/")) return true;
  return false;
}
