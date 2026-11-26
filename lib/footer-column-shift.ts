/** Décalage horizontal desktop des colonnes du footer, en pixels. 0 = position d’origine. */
export const FOOTER_COLUMN_SHIFT_MIN = -1400;
export const FOOTER_COLUMN_SHIFT_MAX = 240;

export type FooterColumnShift = {
  marque: number;
  boutique: number;
  legal: number;
  logo: number;
  instagram: number;
};

export const DEFAULT_FOOTER_COLUMN_SHIFT: FooterColumnShift = {
  marque: 0,
  boutique: 0,
  legal: 0,
  logo: 0,
  instagram: 0,
};

export function clampFooterColumnShift(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(FOOTER_COLUMN_SHIFT_MAX, Math.max(FOOTER_COLUMN_SHIFT_MIN, Math.round(value)));
}

export function normalizeFooterColumnShift(
  input: Partial<Record<keyof FooterColumnShift, unknown>>,
): FooterColumnShift {
  return {
    marque: typeof input.marque === "number" ? clampFooterColumnShift(input.marque) : 0,
    boutique: typeof input.boutique === "number" ? clampFooterColumnShift(input.boutique) : 0,
    legal: typeof input.legal === "number" ? clampFooterColumnShift(input.legal) : 0,
    logo: typeof input.logo === "number" ? clampFooterColumnShift(input.logo) : 0,
    instagram: typeof input.instagram === "number" ? clampFooterColumnShift(input.instagram) : 0,
  };
}
