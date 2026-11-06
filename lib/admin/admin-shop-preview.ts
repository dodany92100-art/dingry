import type { AdminProduct } from "@/lib/admin/types";
import { toCatalogProduct } from "@/lib/admin/types";
import type { ShopProduct } from "@/lib/catalog";
import { sortShopProductsFeatured } from "@/lib/admin/product-display-order";
import { resolveShopCategory } from "@/lib/shop-catalog";

function catalogRowToShopProduct(row: NonNullable<ReturnType<typeof toCatalogProduct>>): ShopProduct {
  const category = resolveShopCategory(row.id, row.category) ?? row.category;
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    variant: row.variant,
    description: row.description,
    ...(row.fabrication ? { fabrication: row.fabrication } : {}),
    ...(row.limitedEdition ? { limitedEdition: row.limitedEdition } : {}),
    ...(row.materials ? { materials: row.materials } : {}),
    ...(row.sizeGuide ? { sizeGuide: row.sizeGuide } : {}),
    category,
    price: row.price,
    image: row.image,
    sizes: row.sizes,
    stock: row.stock,
    ...(row.colorDeclinations?.length ? { colorDeclinations: row.colorDeclinations } : {}),
    isPinned: row.isPinned,
    displayOrder: row.displayOrder,
    adminCreatedAt: row.adminCreatedAt,
  };
}

/** Brouillon affiché comme en ligne pour l’aperçu vitrine admin. */
export function adminProductToShopPreview(product: AdminProduct): ShopProduct | null {
  const forCatalog =
    product.publishStatus === "draft" ? { ...product, publishStatus: "live" as const } : product;
  const row = toCatalogProduct(forCatalog);
  if (!row) return null;
  if (product.publishStatus === "draft" && /\bVERSO\b/i.test(product.variant)) {
    return null;
  }
  return catalogRowToShopProduct(row);
}

export function adminProductsToShopPreview(products: readonly AdminProduct[]): ShopProduct[] {
  return sortShopProductsFeatured(
    products
      .map(adminProductToShopPreview)
      .filter((product): product is ShopProduct => product !== null),
  );
}
