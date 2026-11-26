import { swatchHexForColorLabel } from "@/lib/storefront/color-swatch-chip";
import type { SimilarProductCard } from "@/lib/storefront/similar-products";

function relativeLuminanceFromHex(hex: string): number {
  let h = hex.replace(/^#/, "").trim();
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  if (h.length !== 6) return 0.42;
  const n = Number.parseInt(h, 16);
  if (Number.isNaN(n)) return 0.42;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const linear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

export function swatchLuminanceForColorLabel(label: string): number {
  return relativeLuminanceFromHex(swatchHexForColorLabel(label));
}

/** Pastilles PDP : autres coloris seulement, du plus clair au plus foncé. */
export function pdpColorVariantChoices(variants: readonly SimilarProductCard[]): SimilarProductCard[] {
  return variants
    .filter((item) => !item.isActive)
    .sort((a, b) => swatchLuminanceForColorLabel(b.label) - swatchLuminanceForColorLabel(a.label));
}

export function shouldShowPdpColorPicker(variants: readonly SimilarProductCard[]): boolean {
  return variants.length > 1 && pdpColorVariantChoices(variants).length > 0;
}