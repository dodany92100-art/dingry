import { DINGRY_TEASING_HERO_SRC } from "@/lib/dingry-brand";
import { EDITORIAL_BANNER_ASSETS } from "@/lib/editorial-sections";
import type { ShopHeroFramingMap, ShopHeroSlideFraming } from "@/lib/shop-hero-framing";
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
    src: EDITORIAL_BANNER_ASSETS.rockTheStreet,
    alt: "ROCK THE STREET",
    imageClassName: "object-cover",
    defaultFraming: DEFAULT_SHOP_HERO_FRAMING_DEFAULTS["lookbook-hero"]!,
  },
  {
    id: "atelier-marseille",
    src: "/dingry/editorial/fyma-mon-amour.jpg",
    alt: "Hero FYMA",
    imageClassName: "object-cover md:object-cover",
    defaultFraming: DEFAULT_SHOP_HERO_FRAMING_DEFAULTS["atelier-marseille"]!,
  },
] as const;