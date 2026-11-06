import { compareShopFeaturedDisplay } from "@/lib/admin/product-display-order";
import { isShopProductInStock, type ShopProduct } from "@/lib/catalog";

export type CatalogSort = "featured" | "price-asc" | "price-desc" | "newest" | "in-stock";

export const CATALOG_SORT_OPTIONS: readonly CatalogSort[] = [
  "featured",
  "newest",
  "price-asc",
  "price-desc",
  "in-stock",
];

export const CATALOG_SORT_LABEL: Record<CatalogSort, string> = {
  featured: "Sélection",
  newest: "Nouveautés",
  "price-asc": "Prix croissant",
  "price-desc": "Prix décroissant",
  "in-stock": "En stock d’abord",
};

export function sortCatalogProducts(products: readonly ShopProduct[], sort: CatalogSort): ShopProduct[] {
  const list = [...products];
  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => a.price - b.price || a.id - b.id);
    case "price-desc":
      return list.sort((a, b) => b.price - a.price || a.id - b.id);
    case "newest":
      return list.sort((a, b) => b.id - a.id);
    case "in-stock":
      return list.sort(
        (a, b) =>
          Number(isShopProductInStock(b)) - Number(isShopProductInStock(a)) || a.id - b.id,
      );
    default:
      return list.sort(compareShopFeaturedDisplay);
  }
}
