import type { ProductCategory } from "@/lib/admin/types";
import { detectCategoryFromText } from "@/lib/admin/smart-product-text-parser";

/** Grille tarifaire suggérée (€ TTC) — modifiable manuellement dans la modale. */
export const SUGGESTED_PRICE_EUR_BY_CATEGORY: Readonly<Record<ProductCategory, number>> = {
  "T-shirts": 45,
  Hoodies: 90,
  "Hoodies zippés": 95,
  Crewnecks: 85,
  Jerseys: 75,
  Pants: 110,
  "Crop tops": 40,
  Caps: 35,
};

export const PRODUCT_FAMILY_LABEL: Readonly<Record<ProductCategory, string>> = {
  "T-shirts": "T-shirt",
  Hoodies: "Hoodie",
  "Hoodies zippés": "Hoodie zippé",
  Crewnecks: "Crewneck",
  Jerseys: "Jersey",
  Pants: "Pantalon cargo",
  "Crop tops": "Crop top",
  Caps: "Casquette",
};

export type ProductFamilyParseResult = {
  category?: ProductCategory;
  familyLabel?: string;
  /** Prix conseillé (nombre entier ou décimal). */
  suggestedPrice?: number;
  /** Valeur prête pour le champ prix du formulaire. */
  suggestedPriceLabel?: string;
};

export type FamilyDetectionFormSlice = {
  name: string;
  variant?: string;
  description?: string;
  materials?: string;
};

/** Texte agrégé pour la détection (nom, collage, variantes, story). */
export function buildFamilyDetectionSample(
  form: FamilyDetectionFormSlice,
  smartPasteText = "",
): string {
  return [form.name, smartPasteText, form.variant, form.description, form.materials]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

export function suggestedPriceForCategory(category: ProductCategory): number {
  return SUGGESTED_PRICE_EUR_BY_CATEGORY[category];
}

export function suggestedPriceLabelForCategory(category: ProductCategory): string {
  const value = suggestedPriceForCategory(category);
  return Number.isInteger(value) ? String(value) : String(value);
}

/**
 * Détecte la famille produit (catégorie CRM) et le prix conseillé depuis un titre ou un pavé texte.
 * N’écrase pas un prix explicite déjà présent dans le texte (à combiner côté appelant).
 */
export function parseProductFamilyAndPrice(text: string): ProductFamilyParseResult {
  const category = detectCategoryFromText(text);
  if (!category) return {};
  const suggestedPrice = suggestedPriceForCategory(category);
  return {
    category,
    familyLabel: PRODUCT_FAMILY_LABEL[category],
    suggestedPrice,
    suggestedPriceLabel: suggestedPriceLabelForCategory(category),
  };
}
