
export const SHOP_HERO_SCALE_MIN = 1;
export const SHOP_HERO_SCALE_MAX = 2.25;
/** Permet de « descendre » / monter le cadre au-delà du centre (object-position %). */
export const SHOP_HERO_FOCAL_AXIS_MIN = -12;
export const SHOP_HERO_FOCAL_AXIS_MAX = 112;

export function clampShopHeroFocalAxis(value: number, fallback = 50): number {
  if (!Number.isFinite(value)) return fallback;
  const rounded = Math.round(value);
  return Math.min(SHOP_HERO_FOCAL_AXIS_MAX, Math.max(SHOP_HERO_FOCAL_AXIS_MIN, rounded));
}

export function shopHeroObjectPosition(focalX: number, focalY: number): string {
  return `${clampShopHeroFocalAxis(focalX)}% ${clampShopHeroFocalAxis(focalY)}%`;
}

export type ShopHeroSlideFraming = {
  focalX: number;
  focalY: number;
  scale: number;
};

export type ShopHeroFramingMap = Record<string, ShopHeroSlideFraming>;

export function clampShopHeroScale(value: number): number {
  if (!Number.isFinite(value)) return 1;
  const rounded = Math.round(value * 100) / 100;
  return Math.min(SHOP_HERO_SCALE_MAX, Math.max(SHOP_HERO_SCALE_MIN, rounded));
}

export function normalizeShopHeroSlideFraming(
  input: Partial<ShopHeroSlideFraming> | undefined,
  fallback: ShopHeroSlideFraming,
): ShopHeroSlideFraming {
  if (!input) return fallback;
  return {
    focalX: clampShopHeroFocalAxis(
      typeof input.focalX === "number" ? input.focalX : fallback.focalX,
      fallback.focalX,
    ),
    focalY: clampShopHeroFocalAxis(
      typeof input.focalY === "number" ? input.focalY : fallback.focalY,
      fallback.focalY,
    ),
    scale: clampShopHeroScale(typeof input.scale === "number" ? input.scale : fallback.scale),
  };
}

export function normalizeShopHeroFramingMap(
  input: unknown,
  defaults: ShopHeroFramingMap,
): ShopHeroFramingMap {
  if (!input || typeof input !== "object") return { ...defaults };
  const record = input as Record<string, Partial<ShopHeroSlideFraming>>;
  const out: ShopHeroFramingMap = { ...defaults };
  for (const key of Object.keys(record)) {
    const base = defaults[key] ?? defaults["lookbook-hero"] ?? { focalX: 50, focalY: 40, scale: 1 };
    out[key] = normalizeShopHeroSlideFraming(record[key], base);
  }
  return out;
}

export function shopHeroFramingStyle(framing: ShopHeroSlideFraming): {
  objectPosition: string;
  transform?: string;
  transformOrigin: string;
} {
  const objectPosition = shopHeroObjectPosition(framing.focalX, framing.focalY);
  const transformOrigin = `${framing.focalX}% ${framing.focalY}%`;
  const transform = framing.scale > 1.001 ? `scale(${framing.scale})` : undefined;
  return { objectPosition, transform, transformOrigin };
}

/** Résolution lookbook dynamique `lookbook-123` → clé sauvée ou défaut `lookbook-hero`. */
export function resolveShopHeroFraming(
  slideId: string,
  defaults: ShopHeroSlideFraming,
  map: ShopHeroFramingMap,
): ShopHeroSlideFraming {
  if (map[slideId]) return normalizeShopHeroSlideFraming(map[slideId], defaults);
  if (slideId.startsWith("lookbook-")) {
    const fallback =
      map["lookbook-hero"] ?? map.lookbook ?? defaults;
    return normalizeShopHeroSlideFraming(undefined, fallback);
  }
  return defaults;
}