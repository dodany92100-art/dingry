/** Longueur max par bloc texte fiche produit (admin → boutique). */
export const PRODUCT_STORY_FIELD_MAX = 420;

export type ProductStoryFormFields = {
  description: string;
  fabrication: string;
  limitedEdition: string;
  materials: string;
  sizeGuide: string;
};

export const EMPTY_PRODUCT_STORY: ProductStoryFormFields = {
  description: "",
  fabrication: "",
  limitedEdition: "",
  materials: "",
  sizeGuide: "",
};

export function trimStoryField(value: string, max = PRODUCT_STORY_FIELD_MAX): string {
  return value.trim().slice(0, max);
}
