/** Origin canonique pour `redirectTo` OAuth (aligné sur NEXT_PUBLIC_SITE_URL). */
export function getAuthCallbackOrigin(): string {
  if (typeof window === "undefined") return "";
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  if (raw) {
    try {
      const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      return new URL(withScheme).origin;
    } catch {
      /* fallback */
    }
  }
  return window.location.origin;
}
