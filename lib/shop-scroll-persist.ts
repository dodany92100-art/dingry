/** Position de scroll du conteneur `.dingry-page` (sessionStorage). */

export const SHOP_SCROLL_STORAGE_KEY = "dingry:shop:page-scroll-y";

export function readPersistedShopScroll(): number | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SHOP_SCROLL_STORAGE_KEY);
    if (raw === null) return null;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : null;
  } catch {
    return null;
  }
}

export function writePersistedShopScroll(scrollTop: number): void {
  if (typeof sessionStorage === "undefined") return;
  if (!Number.isFinite(scrollTop) || scrollTop < 0) return;
  try {
    sessionStorage.setItem(SHOP_SCROLL_STORAGE_KEY, String(Math.round(scrollTop)));
  } catch {
    /* quota / private mode */
  }
}
