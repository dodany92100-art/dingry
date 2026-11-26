import type { ShopProduct } from "@/lib/catalog";
import { getModelRef, isValidSku } from "@/lib/sku";

/** Regroupement storefront : priorité au SKU structuré, sinon heuristique nom/catégorie. */
export function shopProductGroupingKey(
  product: Pick<ShopProduct, "name" | "category" | "sku">,
  fallbackKey: string,
): string {
  const sku = product.sku?.trim();
  if (sku && isValidSku(sku)) {
    const modelRef = getModelRef(sku);
    if (modelRef) return `sku-model::${modelRef}`;
  }
  return fallbackKey;
}