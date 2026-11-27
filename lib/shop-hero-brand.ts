import type { Brand } from "@/lib/admin/types";

/** Bandeau d’accueil : slide 0 · 1 · 2 alignés sur les trois marques boutique. */
export const SHOP_HERO_SLIDE_INDEX_BY_BRAND: Record<Brand, number> = {
  DINGRY: 0,
  "ROCK THE STREET": 1,
  FYMA: 2,
};

export function shopHeroSlideIndexForBrand(slideCount: number, brand: Brand): number {
  const index = SHOP_HERO_SLIDE_INDEX_BY_BRAND[brand];
  if (!Number.isFinite(index) || slideCount < 1) return 0;
  return Math.min(Math.max(0, index), slideCount - 1);
}