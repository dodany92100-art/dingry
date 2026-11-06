/** Grille admin / boutique (pas de limite haute stricte sur la saisie libre). */
export const PANT_WAIST_PRESET_SIZES = [
  "28",
  "30",
  "32",
  "34",
  "36",
  "38",
  "40",
  "42",
  "44",
  "46",
] as const;

export const PANT_WAIST_MIN = 24;
export const PANT_WAIST_MAX = 54;

/** Normalise un tour de taille pantalon (24–54). */
export function normalizePantWaistSize(value: string): string | null {
  const trimmed = value.trim();
  if (!/^\d{2}$/.test(trimmed)) return null;
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < PANT_WAIST_MIN || n > PANT_WAIST_MAX) return null;
  return trimmed;
}

export function isValidPantWaistSize(value: string): boolean {
  return normalizePantWaistSize(value) !== null;
}
