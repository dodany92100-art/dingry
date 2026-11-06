import type { ProductCategory } from "@/lib/admin/types";

/** Pastilles couleur admin — libellés {@link ADMIN_COLOR_VARIANTS}. */
export const VARIANT_SWATCH_HEX: Record<string, string> = {
  NOIR: "#0c0c0c",
  BLACK: "#0c0c0c",
  BLANC: "#f4f4f5",
  WHITE: "#f4f4f5",
  VERT: "#15803d",
  ROUGE: "#b91c1c",
  GRIS: "#71717a",
  "GRIS CHINÉ": "#a1a1aa",
  "KING BLUE": "#1e3a8a",
  PINK: "#ec4899",
  "ROYAL BLUE": "#2563eb",
  "BLEU ROI": "#1d4ed8",
  "JAUNE FLUO": "#facc15",
  PURPLE: "#7c3aed",
  CHOCOLAT: "#78350f",
  ZENITH: "#06b6d4",
};

export function swatchHexForVariant(label: string): string | null {
  const key = label.trim().toUpperCase();
  if (VARIANT_SWATCH_HEX[key]) return VARIANT_SWATCH_HEX[key];
  const normalized = label.trim();
  for (const [name, hex] of Object.entries(VARIANT_SWATCH_HEX)) {
    if (name.toUpperCase() === key) return hex;
  }
  if (normalized in VARIANT_SWATCH_HEX) return VARIANT_SWATCH_HEX[normalized];
  return null;
}

const CATEGORY_PRICE_HINT: Partial<Record<ProductCategory, number>> = {
  Hoodies: 80,
  "Hoodies zippés": 90,
  Crewnecks: 50,
  "T-shirts": 35,
  Jerseys: 129,
  Pants: 89,
  "Crop tops": 45,
  Caps: 40,
};

export type SmartCrmHint = {
  id: string;
  message: string;
  tone: "info" | "warn" | "success";
};

type SmartCrmInput = {
  name: string;
  category: ProductCategory;
  variant: string;
  price: string;
  stock: string;
  description: string;
  hasRealImage: boolean;
  publishStatus: "draft" | "live" | "unsaved";
};

export function buildSmartDescriptionDraft(
  name: string,
  category: ProductCategory,
  variant: string,
): string {
  const title = name.trim() || "Pièce DINGRY";
  const color = variant.trim() || "signature";
  const lead =
    category === "Caps"
      ? `${title} — casquette ${color}, finitions brodées et coupe ajustée.`
      : category === "Jerseys"
        ? `${title} — jersey mesh ${color}, esprit street et détails DINGRY Paris.`
        : category === "Pants"
          ? `${title} — pantalon tour ${color}, coupe workwear et confort daily.`
          : `${title} — ${category.toLowerCase()} ${color}, coupe DINGRY et matières premium.`;
  return `${lead} Édition limitée · confection soignée · Rock the Street.`;
}

export function buildSmartCrmHints(input: SmartCrmInput): SmartCrmHint[] {
  const hints: SmartCrmHint[] = [];
  const price = Number(input.price);
  const stock = Number(input.stock);
  const benchmark = CATEGORY_PRICE_HINT[input.category];

  if (!input.description.trim()) {
    hints.push({
      id: "story-empty",
      message: "Smart CRM · Ajoute une description (bouton ✨ Smart Description) pour enrichir la fiche boutique.",
      tone: "info",
    });
  }

  if (benchmark !== undefined && Number.isFinite(price) && price > 0 && price < benchmark * 0.85) {
    hints.push({
      id: "price-low",
      message: `Suggestions d’optimisation · Prix inférieur à la référence ${input.category} (~${benchmark} €).`,
      tone: "warn",
    });
  }

  if (Number.isInteger(stock) && stock <= 3) {
    hints.push({
      id: "stock-low",
      message: "Stock critique · Pense à réapprovisionner ou ajuster la visibilité boutique.",
      tone: "warn",
    });
  }

  if (!input.hasRealImage && input.publishStatus !== "live") {
    hints.push({
      id: "image-draft",
      message: "Mise en ligne · Image WebP requise pour publier sur la boutique.",
      tone: "info",
    });
  }

  if (hints.length === 0) {
    hints.push({
      id: "ok",
      message: "Smart CRM · Fiche cohérente — aucune alerte prioritaire.",
      tone: "success",
    });
  }

  return hints;
}
