import { parsePersoBannerLinkMeta } from "@/lib/catalog-perso-banner-cities";

/** Point focal bannière catalogue perso (object-position %). */
export const DEFAULT_PERSO_BANNER_FOCUS_X = 50;
export const DEFAULT_PERSO_BANNER_FOCUS_Y = 40;

const FOCUS_LINK_PREFIX = "dingry:image-focus:";

export function clampBannerFocusPercent(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_PERSO_BANNER_FOCUS_X;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function encodePersoBannerFocusLink(focusX: number, focusY: number): string {
  return `${FOCUS_LINK_PREFIX}${clampBannerFocusPercent(focusX)},${clampBannerFocusPercent(focusY)}`;
}

export function parsePersoBannerFocusFromLink(
  linkUrl: string | null | undefined,
): { imageFocusX: number; imageFocusY: number } {
  const meta = parsePersoBannerLinkMeta(linkUrl);
  return { imageFocusX: meta.imageFocusX, imageFocusY: meta.imageFocusY };
}

export function bannerObjectPosition(focusX: number, focusY: number): string {
  return `${clampBannerFocusPercent(focusX)}% ${clampBannerFocusPercent(focusY)}%`;
}

export function readBannerFocusFields(
  record: Record<string, unknown>,
  linkUrl?: string | null,
): { imageFocusX: number; imageFocusY: number } {
  const fromLink = parsePersoBannerFocusFromLink(linkUrl);
  const x = typeof record.imageFocusX === "number" ? record.imageFocusX : Number(record.imageFocusX);
  const y = typeof record.imageFocusY === "number" ? record.imageFocusY : Number(record.imageFocusY);
  if (Number.isFinite(x) && Number.isFinite(y)) {
    return {
      imageFocusX: clampBannerFocusPercent(x),
      imageFocusY: clampBannerFocusPercent(y),
    };
  }
  return fromLink;
}
