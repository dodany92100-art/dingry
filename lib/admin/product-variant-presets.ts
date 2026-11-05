import type { ProductCategory } from "@/lib/admin/types";
import { JERSEY_ADMIN_COLOR_VARIANTS } from "@/lib/jersey-shop";

/** Couleurs proposées à la création / édition produit (admin stock). */
export const ADMIN_COLOR_VARIANTS = [
  "NOIR",
  "BLANC",
  "VERT",
  "ROUGE",
  "GRIS",
  "KING BLUE",
  "ROYAL BLUE",
  "JAUNE FLUO",
  "PURPLE",
  "CHOCOLAT",
] as const;

export type AdminColorVariant = (typeof ADMIN_COLOR_VARIANTS)[number];

export const ADMIN_VARIANT_PRESETS: Record<ProductCategory, readonly string[]> = {
  Tee: ["BLANC", "NOIR", "VERT", "ROUGE"],
  Hoodie: ["NOIR", "BLANC", "VERT", "GRIS", "KING BLUE", "ROYAL BLUE", "CHOCOLAT"],
  "Hoodie zippé": ["NOIR", "BLANC"],
  Sweats: ["NOIR", "ROYAL BLUE", "JAUNE FLUO", "PURPLE", "GRIS"],
  Caps: ["NOIR", "ROUGE", "BLANC"],
  Jersey: JERSEY_ADMIN_COLOR_VARIANTS,
};

export function defaultVariantForCategory(category: ProductCategory): string {
  return ADMIN_VARIANT_PRESETS[category][0] ?? "";
}
