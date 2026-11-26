import { SHOP_HERO_SLIDES } from "@/lib/shop-hero-slides";

export type ShopHeroMediaMap = Partial<Record<string, string>>;

const CANONICAL_HERO_SLIDE_IDS = new Set(SHOP_HERO_SLIDES.map((slide) => slide.id));

function isSafePublicImageUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function normalizeShopHeroMediaMap(input: unknown): ShopHeroMediaMap {
  if (!input || typeof input !== "object") return {};
  const record = input as Record<string, unknown>;
  const out: ShopHeroMediaMap = {};
  for (const [key, raw] of Object.entries(record)) {
    if (!CANONICAL_HERO_SLIDE_IDS.has(key) && key !== "lookbook-hero") continue;
    if (typeof raw !== "string" || !raw.trim()) continue;
    const url = raw.trim();
    if (isSafePublicImageUrl(url)) out[key] = url;
  }
  return out;
}

/** Image CRM ou défaut code · `slideId` peut être `lookbook-42` en vitrine. */
export function resolveShopHeroSlideImageUrl(
  slideId: string,
  defaultSrc: string,
  mediaMap: ShopHeroMediaMap,
): string {
  const canonical =
    slideId === "lookbook-hero" || slideId.startsWith("lookbook-") ? "lookbook-hero" : slideId;
  const override = mediaMap[canonical]?.trim() || mediaMap[slideId]?.trim();
  return override && isSafePublicImageUrl(override) ? override : defaultSrc;
}