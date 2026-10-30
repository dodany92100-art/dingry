export const DINGRY_COOKIE_CONSENT_KEY = "dingry-cookie-consent";

export type DingryCookieConsent = "accepted" | "rejected";

export function readCookieConsent(): DingryCookieConsent | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(DINGRY_COOKIE_CONSENT_KEY);
  if (value === "accepted" || value === "rejected") return value;
  return null;
}
