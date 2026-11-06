import { isDraftPlaceholderImage, isProductSize } from "@/lib/admin/types";
import type { ShopProduct } from "@/lib/catalog";

export function assertShopProductModalReady(
  product: ShopProduct,
): { ok: true } | { ok: false; reason: string } {
  if (!Number.isInteger(product.id) || product.id <= 0) {
    return { ok: false, reason: "Identifiant produit invalide." };
  }
  if (!product.image.trim() || isDraftPlaceholderImage(product.image)) {
    return { ok: false, reason: "Image produit manquante." };
  }
  const sizes = product.sizes?.map((s) => s.trim()).filter(Boolean) ?? [];
  if (sizes.length === 0 || !sizes.every(isProductSize)) {
    return { ok: false, reason: "Tailles produit invalides." };
  }
  return { ok: true };
}
