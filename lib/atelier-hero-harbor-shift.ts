/** Décalage logo / CTA hero atelier (harbor), en pixels. 0 = position CSS d’origine. */
export const ATELIER_HERO_HARBOR_SHIFT_MIN = -800;
export const ATELIER_HERO_HARBOR_SHIFT_MAX = 800;

export type AtelierHeroHarborShift = {
  logoX: number;
  logoY: number;
  ctaX: number;
  ctaY: number;
};

export const DEFAULT_ATELIER_HERO_HARBOR_SHIFT: AtelierHeroHarborShift = {
  logoX: 0,
  logoY: 0,
  ctaX: 0,
  ctaY: 0,
};

export function clampAtelierHeroHarborShift(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(
    ATELIER_HERO_HARBOR_SHIFT_MAX,
    Math.max(ATELIER_HERO_HARBOR_SHIFT_MIN, Math.round(value)),
  );
}

export function normalizeAtelierHeroHarborShift(
  input: Partial<Record<keyof AtelierHeroHarborShift, unknown>>,
): AtelierHeroHarborShift {
  return {
    logoX: typeof input.logoX === "number" ? clampAtelierHeroHarborShift(input.logoX) : 0,
    logoY: typeof input.logoY === "number" ? clampAtelierHeroHarborShift(input.logoY) : 0,
    ctaX: typeof input.ctaX === "number" ? clampAtelierHeroHarborShift(input.ctaX) : 0,
    ctaY: typeof input.ctaY === "number" ? clampAtelierHeroHarborShift(input.ctaY) : 0,
  };
}

export function atelierHeroHarborShiftStyle(shift: AtelierHeroHarborShift): Record<string, string> {
  return {
    "--atelier-hero-logo-x": `${shift.logoX}px`,
    "--atelier-hero-logo-y": `${shift.logoY}px`,
    "--atelier-hero-cta-x": `${shift.ctaX}px`,
    "--atelier-hero-cta-y": `${shift.ctaY}px`,
  };
}