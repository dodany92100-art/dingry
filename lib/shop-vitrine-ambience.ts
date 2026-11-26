import { DINGRY_PRODUCT_MODAL_AMBIENCE_SRC } from "@/lib/dingry-brand";
import {
  bannerObjectPosition,
  clampBannerFocusPercent,
  DEFAULT_PERSO_BANNER_FOCUS_X,
} from "@/lib/catalog-perso-banner-focus";

/** Visuel latéral panier / favoris + fond modale produit (même réglage). */
export type ShopVitrineAmbienceConfig = {
  imageUrl: string;
  focusX: number;
  focusY: number;
};

export const DEFAULT_SHOP_VITRINE_AMBIENCE: ShopVitrineAmbienceConfig = {
  imageUrl: DINGRY_PRODUCT_MODAL_AMBIENCE_SRC,
  focusX: DEFAULT_PERSO_BANNER_FOCUS_X,
  focusY: 35,
};

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

export function normalizeShopVitrineAmbience(input: unknown): ShopVitrineAmbienceConfig {
  const fallback = DEFAULT_SHOP_VITRINE_AMBIENCE;
  if (!input || typeof input !== "object") return { ...fallback };
  const record = input as Record<string, unknown>;
  const rawUrl = typeof record.imageUrl === "string" ? record.imageUrl.trim() : fallback.imageUrl;
  const imageUrl = isSafePublicImageUrl(rawUrl) ? rawUrl : fallback.imageUrl;
  return {
    imageUrl,
    focusX: clampBannerFocusPercent(
      typeof record.focusX === "number" ? record.focusX : fallback.focusX,
    ),
    focusY: clampBannerFocusPercent(
      typeof record.focusY === "number" ? record.focusY : fallback.focusY,
    ),
  };
}

export function vitrineAmbienceObjectPosition(config: ShopVitrineAmbienceConfig): string {
  return bannerObjectPosition(config.focusX, config.focusY);
}