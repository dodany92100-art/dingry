import { createSeededStore } from "@/lib/admin/seed";
import {
  type CatalogProduct,
  type ProductCategory,
} from "@/lib/admin/types";

export type ShopProduct = {
  id: number;
  name: string;
  variant: string;
  price: number;
  image: string;
  description: string;
  category: string;
  sku?: string;
  sizes?: string[];
  stock?: number;
};

function asCategory(value: string): ProductCategory {
  if (value === "Hoodie" || value === "Hoodie zippé" || value === "Tee") return value;
  return "Tee";
}

export function catalogToShopProduct(product: CatalogProduct): ShopProduct {
  return {
    id: product.id,
    name: product.name,
    variant: product.variant,
    price: product.price,
    image: product.image,
    description: product.description,
    category: product.category,
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
  const managedIds = new Set(createSeededStore().products.map((product) => Number(product.id)));

  const merged = fallback
    .filter((product) => !managedIds.has(product.id) || liveById.has(product.id))
    .map((product) => {
      const overlay = liveById.get(product.id);
      if (!overlay) return product;
      return {
        ...product,
        name: overlay.name,
        variant: overlay.variant || product.variant,
        price: overlay.price,
        image: overlay.image,
        description: overlay.description || product.description,
        category: overlay.category || product.category,
        sku: overlay.sku,
        sizes: overlay.sizes,
        stock: overlay.stock,
      };
    });

  const extras = live
    .filter((product) => !fallback.some((item) => item.id === product.id))
    .map(catalogToShopProduct);

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
    category: asCategory(typeof record.category === "string" ? record.category : "Tee"),
    price,
    image: record.image,
    sizes: Array.isArray(record.sizes)
      ? record.sizes.filter((item): item is CatalogProduct["sizes"][number] =>
          item === "S" || item === "M" || item === "L" || item === "XL",
        )
      : ["S", "M", "L", "XL"],
    stock: Number.isFinite(Number(record.stock)) ? Math.max(0, Number(record.stock)) : 0,
  };
}
