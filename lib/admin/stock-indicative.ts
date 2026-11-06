import type { AdminProduct } from "@/lib/admin/types";

/** Couleurs et tailles cochées, sans doublon avec la variante principale. */
export function stockIndicativeVariants(
  product: Pick<AdminProduct, "variant" | "sizes" | "colorDeclinations">,
): string {
  const sizes = product.sizes.map((size) => size.trim()).filter(Boolean);
  const sizeKeys = new Set(sizes.map((size) => size.toUpperCase()));
  const colors = product.colorDeclinations.map((color) => color.trim()).filter(Boolean);
  const colorLine =
    colors.length > 0
      ? colors.join(" · ")
      : product.variant.trim() && !sizeKeys.has(product.variant.trim().toUpperCase())
        ? product.variant.trim()
        : "";
  return [colorLine, sizes.join(" · ")].filter(Boolean).join(" · ");
}
