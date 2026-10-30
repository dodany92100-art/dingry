import {
  type CatalogProduct,
} from "@/lib/admin/types";
import { CATALOG_CANONICAL_IMAGE_BY_ID } from "@/lib/dingry-product-media";
import { normalizeAdminCategory, resolveShopCategory, type ShopCategory } from "@/lib/shop-catalog";

export type ShopProduct = {
  id: number;
  name: string;
  variant: string;
  price: number;
  image: string;
  description: string;
  category: ShopCategory | string;
  sku?: string;
  sizes?: string[];
  stock?: number;
};

export function catalogToShopProduct(product: CatalogProduct): ShopProduct {
  return {
    id: product.id,
    name: product.name,
    variant: product.variant,
    price: product.price,
    image: product.image,
    description: product.description,
    category: resolveShopCategory(product.id, product.category),
    sku: product.sku,
    sizes: product.sizes,
    stock: product.stock,
  };
}

export function overlayShopCatalog(
  fallback: ShopProduct[],
  live: CatalogProduct[],
): ShopProduct[] {
  const liveById = new Map(live.map((product) => [product.id, product]));

  const merged = fallback.map((product) => {
    const overlay = liveById.get(product.id);
    const canonicalImage = CATALOG_CANONICAL_IMAGE_BY_ID[product.id];
    if (!overlay) {
      const image = canonicalImage ?? product.image;
      const category = resolveShopCategory(product.id, product.category);
      return image !== product.image || category !== product.category
        ? { ...product, image, category }
        : product;
    }
    return {
      ...product,
      name: overlay.name,
      variant: overlay.variant || product.variant,
      price: overlay.price,
      image: canonicalImage ?? overlay.image,
      description: overlay.description || product.description,
      category: resolveShopCategory(product.id, overlay.category || product.category),
      sku: overlay.sku,
      sizes: overlay.sizes,
      stock: overlay.stock,
    };
  });

  const extras = live
    .filter((product) => !fallback.some((item) => item.id === product.id))
    .map(catalogToShopProduct)
    .map((product) => {
      const canonicalImage = CATALOG_CANONICAL_IMAGE_BY_ID[product.id];
      return canonicalImage ? { ...product, image: canonicalImage } : product;
    });

  return [...merged, ...extras];
}

export function shopProductFromUnknown(value: unknown): CatalogProduct | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = Number(record.id);
  const price = Number(record.price);
  if (!Number.isInteger(id) || id <= 0 || !Number.isFinite(price) || price <= 0) return null;
  if (typeof record.name !== "string" || typeof record.image !== "string") return null;
  return {
    id,
    sku: typeof record.sku === "string" ? record.sku : `DINGRY-${id}`,
    name: record.name,
    variant: typeof record.variant === "string" ? record.variant : "",
    description: typeof record.description === "string" ? record.description : "",
    category: normalizeAdminCategory(typeof record.category === "string" ? record.category : "Tee"),
    price,
    image: record.image,
    sizes: Array.isArray(record.sizes)
      ? record.sizes.filter((item): item is CatalogProduct["sizes"][number] =>
          item === "S" || item === "M" || item === "L" || item === "XL" || item === "TU",
        )
      : ["S", "M", "L", "XL"],
    stock: Number.isFinite(Number(record.stock)) ? Math.max(0, Number(record.stock)) : 0,
  };
}
