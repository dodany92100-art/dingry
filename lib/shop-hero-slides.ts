import {
  DINGRY_ATELIER_HERO_SRC,
  DINGRY_TEASING_HERO_SRC,
} from "@/lib/dingry-brand";
import type { ShopHeroFramingMap, ShopHeroSlideFraming } from "@/lib/shop-hero-framing";
import { LOOKBOOK_ENTRIES } from "@/lib/shop-data";

const LOOKBOOK_HERO_SEED = LOOKBOOK_ENTRIES[0];
const LOOKBOOK_HERO_SEED_SRC = LOOKBOOK_HERO_SEED?.[0] ?? DINGRY_TEASING_HERO_SRC;
const LOOKBOOK_HERO_SEED_ALT =
  typeof LOOKBOOK_HERO_SEED?.[1] === "string" ? LOOKBOOK_HERO_SEED[1] : "DINGRY Lookbook";

export type ShopHeroSlide = {
  id: string;
  src: string;
  alt: string;
  imageClassName: string;
  defaultFraming: ShopHeroSlideFraming;
};

export const DEFAULT_SHOP_HERO_FRAMING_DEFAULTS: ShopHeroFramingMap = {
  collection: { focalX: 50, focalY: 38, scale: 1 },
  "lookbook-hero": { focalX: 50, focalY: 38, scale: 1 },
  "atelier-marseille": { focalX: 50, focalY: 40, scale: 1 },
};

/** Bandeau d’accueil · même ratio plein écran que le hero historique. */
export const SHOP_HERO_SLIDES: readonly ShopHeroSlide[] = [
  {
    id: "collection",
    src: DINGRY_TEASING_HERO_SRC,
    alt: "DINGRY — collection",
    imageClassName: "object-cover md:object-cover",
    defaultFraming: DEFAULT_SHOP_HERO_FRAMING_DEFAULTS.collection!,
  },
  {
    id: "lookbook-hero",
    src: LOOKBOOK_HERO_SEED_SRC,
    alt: LOOKBOOK_HERO_SEED_ALT,
    imageClassName: "object-cover",
    defaultFraming: DEFAULT_SHOP_HERO_FRAMING_DEFAULTS["lookbook-hero"]!,
  },
  {
    id: "atelier-marseille",
    src: DINGRY_ATELIER_HERO_SRC,
    alt: "DINGRY Custom — Marseille",
    imageClassName: "object-cover md:object-cover",
    defaultFraming: DEFAULT_SHOP_HERO_FRAMING_DEFAULTS["atelier-marseille"]!,
  },
] as const;