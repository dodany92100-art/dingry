/** Cadrage du visuel Origines (object-position, %). 22 = cadrage d’origine. */
export const DEFAULT_ORIGINES_PREVIEW_FOCUS_Y = 22;

/** 100 = photo pleine, sans voile. 0 = voile noir. */
export const DEFAULT_ORIGINES_PREVIEW_OPACITY = 100;

export function clampOriginesPreviewFocusY(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_ORIGINES_PREVIEW_FOCUS_Y;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function clampOriginesPreviewOpacity(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_ORIGINES_PREVIEW_OPACITY;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function originesPreviewObjectPosition(focusY: number): string {
  return `center ${clampOriginesPreviewFocusY(focusY)}%`;
}
