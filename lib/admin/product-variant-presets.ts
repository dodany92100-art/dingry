import { PANT_WAIST_PRESET_SIZES, PRODUCT_CATEGORIES, type ProductCategory } from "@/lib/admin/types";

/** Pastilles CRM : une entrée canonique par teinte (pas de doublon Noir/BLACK). */
export const ADMIN_COLOR_PRESETS_CANONICAL = [
  "NOIR",
  "BLANC",
  "VERT",
  "ROUGE",
  "ORANGE",
  "GRIS",
  "GRIS CHINÉ",
  "ROYAL BLUE",
  "PINK",
  "JAUNE FLUO",
  "PURPLE",
  "CHOCOLAT",
  "ZENITH",
] as const;

export type AdminColorPresetCanonical = (typeof ADMIN_COLOR_PRESETS_CANONICAL)[number];

/** Toutes les clés acceptées (parseur, imports legacy, `colorDeclinations`). */
export const ADMIN_COLOR_VARIANTS = [
  ...ADMIN_COLOR_PRESETS_CANONICAL,
  "BLACK",
  "WHITE",
  "KING BLUE",
  "BLEU ROI",
] as const;

export type AdminColorVariant = (typeof ADMIN_COLOR_VARIANTS)[number];

function variantPresetsForCategory(category: ProductCategory): readonly string[] {
  if (category === "Pants") return PANT_WAIST_PRESET_SIZES;
  return ADMIN_COLOR_PRESETS_CANONICAL;
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
