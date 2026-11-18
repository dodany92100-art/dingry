export type CatalogWishlistToggleDeps = {
  isFavorite: (productId: number) => boolean;
  toggleFavorite: (productId: number) => void;
};

/**
 * Favori catalogue : bascule locale + animation vers la nav.
 * Ne doit jamais ouvrir le tiroir compte (connecté ou invité).
 */
export function toggleCatalogWishlistFavorite(
  productId: number,
  deps: CatalogWishlistToggleDeps,
): "added" | "removed" {
  const adding = !deps.isFavorite(productId);
  deps.toggleFavorite(productId);
  return adding ? "added" : "removed";
}