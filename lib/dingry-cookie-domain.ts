/** Domaine cookie partagé sous-domaines dingry.com — `DINGRY_COOKIE_DOMAIN` (ex. `.dingry.com`). */
export function dingrySharedCookieDomain(): string | undefined {
  const raw = process.env.DINGRY_COOKIE_DOMAIN?.trim();
  return raw || undefined;
}