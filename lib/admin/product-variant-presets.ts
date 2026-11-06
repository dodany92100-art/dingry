import { PANT_WAIST_PRESET_SIZES, PRODUCT_CATEGORIES, type ProductCategory } from "@/lib/admin/types";

/** Toutes les couleurs / coloris DINGRY (admin stock). */
export const ADMIN_COLOR_VARIANTS = [
  "NOIR",
  "BLACK",
  "BLANC",
  "WHITE",
  "VERT",
  "ROUGE",
  "GRIS",
  "GRIS CHINÉ",
  "KING BLUE",
  "PINK",
  "ROYAL BLUE",
  "BLEU ROI",
  "JAUNE FLUO",
  "PURPLE",
  "CHOCOLAT",
  "ZENITH",
] as const;

export type AdminColorVariant = (typeof ADMIN_COLOR_VARIANTS)[number];

function variantPresetsForCategory(category: ProductCategory): readonly string[] {
  if (category === "Pants") return PANT_WAIST_PRESET_SIZES;
  return ADMIN_COLOR_VARIANTS;
}

export const ADMIN_VARIANT_PRESETS = Object.fromEntries(
  PRODUCT_CATEGORIES.map((category) => [category, variantPresetsForCategory(category)]),
) as Record<ProductCategory, readonly string[]>;

export function defaultVariantForCategory(category: ProductCategory): string {
  if (category === "Pants") return "32";
  return ADMIN_COLOR_VARIANTS[0] ?? "NOIR";
}

export function isPantsCategory(category: ProductCategory): boolean {
  return category === "Pants";
}
