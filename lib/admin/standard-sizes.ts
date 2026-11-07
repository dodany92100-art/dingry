import type { OfficialProductCategory as ProductCategory } from "@/lib/dingry-product-taxonomy";

/** Sélection par défaut (nouvelle fiche) : S → XXL (`2XL`). */
export const STANDARD_LETTER_SIZES = ["S", "M", "L", "XL", "2XL"] as const;

export type StandardLetterSize = (typeof STANDARD_LETTER_SIZES)[number];

const STANDARD_ORDER = new Map<string, number>(
  STANDARD_LETTER_SIZES.map((size, index) => [size, index]),
);

export function normalizeToStandardLetterSize(raw: string): StandardLetterSize | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  if (upper === "XXL") return "2XL";
  if ((STANDARD_LETTER_SIZES as readonly string[]).includes(trimmed)) {
    return trimmed as StandardLetterSize;
  }
  return null;
}

export function isStandardLetterSize(raw: string): boolean {
  return normalizeToStandardLetterSize(raw) !== null;
}

/** Tailles cochées par défaut à la création — la grille admin garde toutes les lettres. */
export function defaultSelectedSizesForCategory(category: ProductCategory): string[] {
  if (category === "Caps") return ["TU"];
  if (category === "Pants") return [];
  if (category === "Crop tops") return ["S", "M", "L", "XL"];
  return [...STANDARD_LETTER_SIZES];
}

/** Conserve uniquement S–XXL, ordre canonique, sans doublon. */
export function filterStandardLetterSizes(sizes: readonly string[]): StandardLetterSize[] {
  const out: StandardLetterSize[] = [];
  const seen = new Set<string>();
  for (const raw of sizes) {
    const norm = normalizeToStandardLetterSize(raw);
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    out.push(norm);
  }
  return out.sort(
    (a, b) => (STANDARD_ORDER.get(a) ?? 99) - (STANDARD_ORDER.get(b) ?? 99),
  );
}
