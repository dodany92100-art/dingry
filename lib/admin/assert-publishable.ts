import type { AdminProduct } from "@/lib/admin/types";
import { isDraftPlaceholderImage, isProductSize } from "@/lib/admin/types";

export class PublishValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublishValidationError";
  }
}

export function assertPublishableProduct(
  product: AdminProduct,
): { ok: true } | { ok: false; reason: string } {
  const id = Number(product.id);
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, reason: "Identifiant produit invalide." };
  }
  if (!product.imageUrl.trim() || isDraftPlaceholderImage(product.imageUrl)) {
    return { ok: false, reason: "Image WebP requise." };
  }
  if (!Number.isFinite(product.price) || product.price <= 0) {
    return { ok: false, reason: "Prix invalide." };
  }
  if (product.sizes.length === 0 || !product.sizes.every(isProductSize)) {
    return { ok: false, reason: "Au moins une taille valide requise." };
  }
  return { ok: true };
}

export function requirePublishableProduct(product: AdminProduct): void {
  const verdict = assertPublishableProduct(product);
  if (!verdict.ok) throw new PublishValidationError(verdict.reason);
}
