import type { CSSProperties } from "react";
import { adminSwatchHex, adminSwatchStyle } from "@/lib/admin/dingry-color-palette";
import { VARIANT_SWATCH_HEX } from "@/lib/admin/smart-crm";

/** Teinte pastille pour un libellé coloris (ex. « KING BLUE / PINK » → bleu roi). */
export function swatchHexForColorLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "#78716c";

  const direct = adminSwatchHex(trimmed);
  if (direct) return direct;

  const segments = trimmed
    .split("/")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  for (const segment of segments) {
    const hex = adminSwatchHex(segment);
    if (hex) return hex;
  }

  const upper = trimmed.toUpperCase();
  const presetKeys = Object.keys(VARIANT_SWATCH_HEX).sort((a, b) => b.length - a.length);
  for (const key of presetKeys) {
    if (upper.includes(key)) return VARIANT_SWATCH_HEX[key] ?? "#78716c";
  }

  const fallback = adminSwatchStyle(trimmed).backgroundColor;
  return fallback.startsWith("#") ? fallback : "#78716c";
}

function hexRelativeLuminance(hex: string): number {
  let h = hex.replace(/^#/, "").trim();
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  if (h.length !== 6) return 0.42;
  const n = Number.parseInt(h, 16);
  if (Number.isNaN(n)) return 0.42;
  const chan = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = chan((n >> 16) & 255);
  const g = chan((n >> 8) & 255);
  const b = chan(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isLightSwatch(raw: string, hex: string): boolean {
  const key = raw.trim().toUpperCase();
  if (
    key === "BLANC" ||
    key === "WHITE" ||
    hex.toLowerCase() === "#f4f4f5" ||
    hex.toLowerCase() === "#fafaf9" ||
    hex.toLowerCase() === "#ffffff"
  ) {
    return true;
  }
  return hexRelativeLuminance(hex) >= 0.62;
}

/** Contour or PDP : noir uniquement (pas bleu, chocolat, etc.). */
export function isBlackSwatchLabel(label: string, hex: string): boolean {
  const upper = label.trim().toUpperCase();
  const head = (upper.split("/")[0] ?? upper).trim();
  if (head === "NOIR" || head === "BLACK") return true;

  const h = hex.replace(/^#/, "").trim();
  if (h.length !== 6) return false;
  const n = Number.parseInt(h, 16);
  if (Number.isNaN(n)) return false;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return r <= 14 && g <= 14 && b <= 14;
}

/** Style inline pour chip couleur modale boutique (fond = teinte réelle). */
export function colorSwatchChipStyle(...candidates: string[]): CSSProperties {
  const raw = candidates.map((v) => v.trim()).find((v) => v.length > 0) ?? "";
  const hex = swatchHexForColorLabel(raw);
  const light = isLightSwatch(raw, hex);
  return {
    backgroundColor: hex,
    border: light ? "2px solid rgb(120 113 108 / 0.5)" : "2px solid rgb(0 0 0 / 0.22)",
    boxShadow: light
      ? "inset 0 0 0 1px rgb(120 113 108 / 0.45)"
      : "inset 0 1px 0 rgb(255 255 255 / 0.15)",
    color: light ? "#161616" : "#ffffff",
  };
}

/** Pastilles rondes PDP : filet or fin uniquement sur le noir. */
export function colorSwatchPdpStyle(label: string): CSSProperties {
  const hex = swatchHexForColorLabel(label);
  const light = isLightSwatch(label, hex);
  const black = isBlackSwatchLabel(label, hex);
  return {
    backgroundColor: hex,
    border: black
      ? "1px solid transparent"
      : light
        ? "1px solid rgb(120 113 108 / 0.38)"
        : "1px solid transparent",
    boxShadow: light ? "inset 0 0 0 1px rgb(120 113 108 / 0.25)" : "none",
  };
}