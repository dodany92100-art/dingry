export const WISHLIST_KEY = "dingry-wishlist";

const LEGACY_SESSION_KEY = "dingry-wishlist";

function parseWishlistRaw(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is number => typeof id === "number" && Number.isInteger(id));
  } catch {
    return [];
  }
}

function migrateSessionWishlistToLocal(): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(WISHLIST_KEY)) return;
    const legacy = sessionStorage.getItem(LEGACY_SESSION_KEY);
    if (!legacy) return;
    localStorage.setItem(WISHLIST_KEY, legacy);
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
  } catch {
    // navigation privée / quota
  }
}

export function readWishlistIds(): number[] {
  if (typeof window === "undefined") return [];
  migrateSessionWishlistToLocal();
  try {
    return parseWishlistRaw(localStorage.getItem(WISHLIST_KEY));
  } catch {
    return [];
  }
}

export function writeWishlistIds(ids: number[]): void {
  if (typeof window === "undefined") return;
  try {
    if (ids.length === 0) localStorage.removeItem(WISHLIST_KEY);
    else localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
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
