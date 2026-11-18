import { describe, expect, it, vi } from "vitest";
import { toggleCatalogWishlistFavorite } from "@/lib/shop/catalog-wishlist-toggle";

describe("toggleCatalogWishlistFavorite", () => {
  it("ajoute un favori invité sans callback auth", () => {
    const toggleFavorite = vi.fn();
    const isFavorite = vi.fn(() => false);
    const result = toggleCatalogWishlistFavorite(6, { isFavorite, toggleFavorite });
    expect(result).toBe("added");
    expect(toggleFavorite).toHaveBeenCalledWith(6);
    expect(isFavorite).toHaveBeenCalledWith(6);
  });

  it("retire un favori déjà actif", () => {
    const toggleFavorite = vi.fn();
    const isFavorite = vi.fn(() => true);
    const result = toggleCatalogWishlistFavorite(6, { isFavorite, toggleFavorite });
    expect(result).toBe("removed");
    expect(toggleFavorite).toHaveBeenCalledWith(6);
  });
});