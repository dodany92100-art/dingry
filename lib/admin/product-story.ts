import type { ProductPrintPlacement } from "@/lib/admin/types";

/** Longueur max par bloc texte fiche produit (admin → boutique). */
export const PRODUCT_STORY_FIELD_MAX = 420;

export type ProductStoryFormFields = {
  description: string;
  fabrication: string;
  limitedEdition: string;
  materials: string;
  sizeGuide: string;
  printPlacement: ProductPrintPlacement;
};

export const EMPTY_PRODUCT_STORY: ProductStoryFormFields = {
  description: "",
  fabrication: "",
  limitedEdition: "",
  materials: "",
  sizeGuide: "",
  printPlacement: "",
};

export function trimStoryField(value: string, max = PRODUCT_STORY_FIELD_MAX): string {
  return value.trim().slice(0, max);
}

/** Comparaison Smart Collage ↔ fiche (casse, espaces, sauts de ligne). */
export function normalizeStoryComparison(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function storyFieldsSemanticallyEqual(a: string, b: string): boolean {
  if (a === b) return true;
  return normalizeStoryComparison(a) === normalizeStoryComparison(b);
}
