import { PRODUCT_CATEGORIES, type ProductCategory } from "@/lib/admin/types";

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

export const ADMIN_VARIANT_PRESETS = Object.fromEntries(
  PRODUCT_CATEGORIES.map((category) => [category, ADMIN_COLOR_VARIANTS]),
) as Record<ProductCategory, readonly AdminColorVariant[]>;

export function defaultVariantForCategory(category: ProductCategory): string {
  return ADMIN_VARIANT_PRESETS[category][0] ?? "NOIR";
}
