const WISHLIST_KEY = "dingry-wishlist";

export function readWishlistIds(): number[] {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is number => typeof id === "number" && Number.isInteger(id));
  } catch {
    return [];
  }
}

export function writeWishlistIds(ids: number[]): void {
  try {
    if (ids.length === 0) sessionStorage.removeItem(WISHLIST_KEY);
    else sessionStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
  } catch {
    // navigation privée
  }
}

export function toggleWishlistId(productId: number): number[] {
  const current = readWishlistIds();
  const next = current.includes(productId)
    ? current.filter((id) => id !== productId)
    : [...current, productId];
  writeWishlistIds(next);
  return next;
}

export function isInWishlist(productId: number): boolean {
  return readWishlistIds().includes(productId);
}
