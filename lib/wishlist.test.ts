import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WISHLIST_KEY, readWishlistIds, toggleWishlistId, writeWishlistIds } from "@/lib/wishlist";

function createStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

describe("wishlist storage", () => {
  beforeEach(() => {
    const local = createStorage();
    const session = createStorage();
    vi.stubGlobal("localStorage", local);
    vi.stubGlobal("sessionStorage", session);
    vi.stubGlobal("window", { localStorage: local, sessionStorage: session });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lit et écrit dans localStorage", () => {
    writeWishlistIds([3, 7]);
    expect(localStorage.getItem(WISHLIST_KEY)).toBe("[3,7]");
    expect(readWishlistIds()).toEqual([3, 7]);
  });

  it("toggle ajoute et retire", () => {
    expect(toggleWishlistId(12)).toEqual([12]);
    expect(toggleWishlistId(12)).toEqual([]);
  });

  it("migre l’ancien sessionStorage", () => {
    sessionStorage.setItem(WISHLIST_KEY, "[5]");
    expect(readWishlistIds()).toEqual([5]);
    expect(localStorage.getItem(WISHLIST_KEY)).toBe("[5]");
    expect(sessionStorage.getItem(WISHLIST_KEY)).toBeNull();
  });
});
