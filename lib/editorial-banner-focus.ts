import type { EditorialBannerId } from "@/lib/editorial-sections";

export type EditorialBannerFocus = { x: number; y: number };

export const DEFAULT_EDITORIAL_BANNER_FOCUS: Record<EditorialBannerId, EditorialBannerFocus> = {
  dingry: { x: 42, y: 28 },
  rockTheStreet: { x: 72, y: 50 },
  fyma: { x: 48, y: 22 },
};

export function clampEditorialBannerFocus(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function editorialBannerObjectPosition(focus: EditorialBannerFocus): string {
  const x = clampEditorialBannerFocus(focus.x);
  const y = clampEditorialBannerFocus(focus.y);
  return `${x}% ${y}%`;
}