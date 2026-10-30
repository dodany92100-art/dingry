import type { ShopProduct } from "@/lib/catalog";
import { DINGRY_JERSEY_PRODUCT_IDS } from "@/lib/dingry-product-media";

export const JERSEY_CATALOG_PRODUCT_ID = 41;
export const JERSEY_COLOR_PRODUCT_IDS = {
  BLANC: 41,
  NOIR: 42,
} as const;

export const JERSEY_COLOR_OPTIONS = [
  { key: "BLANC", label: "Blanc", productId: JERSEY_COLOR_PRODUCT_IDS.BLANC },
  { key: "NOIR", label: "Noir", productId: JERSEY_COLOR_PRODUCT_IDS.NOIR },
] as const;

export type JerseyColorKey = (typeof JERSEY_COLOR_OPTIONS)[number]["key"];

export const JERSEY_ADMIN_COLOR_VARIANTS = ["BLANC", "NOIR"] as const;

export function isJerseyShopProduct(product: { id: number; category: string }): boolean {
  return DINGRY_JERSEY_PRODUCT_IDS.has(product.id) || product.category === "Jersey";
}

export function isJerseyCatalogGridProduct(product: { id: number; category: string }): boolean {
  return DINGRY_JERSEY_PRODUCT_IDS.has(product.id);
}

export function jerseyColorKeyFromProduct(product: { id: number; variant: string }): JerseyColorKey {
  if (product.id === JERSEY_COLOR_PRODUCT_IDS.NOIR || /^NOIR$/i.test(product.variant.trim())) {
    return "NOIR";
  }
  return "BLANC";
}

export function resolveJerseyProduct(
  products: ShopProduct[],
  color: JerseyColorKey,
): ShopProduct | undefined {
  const productId = JERSEY_COLOR_PRODUCT_IDS[color];
  return products.find((item) => item.id === productId);
}
