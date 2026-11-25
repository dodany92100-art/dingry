import type { Brand, ProductCollection } from "@/lib/admin/types";
import {
  DINGRY_EDITORIAL_IMAGE_URL,
  DINGRY_LOGO_URL,
  DINGRY_STREET_WORDMARK_URL,
  DINGRY_TEASING_HERO_SRC,
} from "@/lib/dingry-brand";

export const BRAND_PAGE_SLUGS = ["dingry", "rock-the-street", "fyma"] as const;
export type BrandPageSlug = (typeof BRAND_PAGE_SLUGS)[number];

export const DINGRY_MADA_COLLECTION = "DINGRY MADA" satisfies ProductCollection;

export type BrandPageMadaSection = {
  collection: typeof DINGRY_MADA_COLLECTION;
  anchorId: "brand-mada-collection";
};

export type BrandPageConfig = {
  slug: BrandPageSlug;
  brand: Brand;
  heroSrc: string;
  logoSrc: string;
  /** Couleur d’accent (bordures, boutons secondaires). */
  accentHex: string;
  /** Texte de présentation : clés `brandPages.<slug>.title|lead`. */
  i18nKey: BrandPageSlug;
  madaSection?: BrandPageMadaSection;
};

export const BRAND_PAGE_CONFIGS: Record<BrandPageSlug, BrandPageConfig> = {
  dingry: {
    slug: "dingry",
    brand: "DINGRY",
    heroSrc: DINGRY_TEASING_HERO_SRC,
    logoSrc: DINGRY_LOGO_URL,
    accentHex: "#FF3D00",
    i18nKey: "dingry",
    madaSection: {
      collection: DINGRY_MADA_COLLECTION,
      anchorId: "brand-mada-collection",
    },
  },
  "rock-the-street": {
    slug: "rock-the-street",
    brand: "ROCK THE STREET",
    heroSrc: DINGRY_EDITORIAL_IMAGE_URL,
    logoSrc: DINGRY_STREET_WORDMARK_URL,
    accentHex: "#C9A962",
    i18nKey: "rock-the-street",
  },
  fyma: {
    slug: "fyma",
    brand: "FYMA",
    heroSrc: DINGRY_TEASING_HERO_SRC,
    logoSrc: DINGRY_LOGO_URL,
    accentHex: "#7C5CFF",
    i18nKey: "fyma",
  },
};

export function brandPageConfigForSlug(slug: string): BrandPageConfig | null {
  const key = slug.trim().toLowerCase();
  if (!(BRAND_PAGE_SLUGS as readonly string[]).includes(key)) return null;
  return BRAND_PAGE_CONFIGS[key as BrandPageSlug];
}