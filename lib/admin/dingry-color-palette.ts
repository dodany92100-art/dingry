/**
 * Palette admin · source unique : {@link ADMIN_COLOR_VARIANTS}, hex {@link VARIANT_SWATCH_HEX},
 * alias pastilles déjà présents dans l’éditeur CRM (GREEN→VERT, etc.).
 */

import { colorAbbrevFromDeclinationLabel } from "@/lib/catalog/dingry-color-abbrev";
import {
  buildDingryVariantSku,
  buildVariantAltText,
  dingryR2VariantObjectKey,
} from "@/lib/catalog/dingry-variant-naming";
import { normalizeOptionKey } from "@/lib/catalog/product-options";
import {
  ADMIN_COLOR_PRESETS_CANONICAL,
  ADMIN_COLOR_VARIANTS,
  type AdminColorPresetCanonical,
  type AdminColorVariant,
} from "@/lib/admin/product-variant-presets";
import { VARIANT_SWATCH_HEX, swatchHexForVariant } from "@/lib/admin/smart-crm";

/** Alias hex déjà utilisés dans `product-editor-modal` (pas de nouvelle couleur). */
const SWATCH_HEX_ALIASES: Record<string, string> = {
  GREEN: "#166534",
  RED: "#b91c1c",
  GRAY: "#78716c",
  GREY: "#78716c",
  "GRIS CHINE": "#a8a29e",
  ROSE: "#db2777",
  VIOLET: "#7c3aed",
  YELLOW: "#ca8a04",
  BROWN: "#713f12",
  BLUE: "#2563eb",
  BLEU: "#2563eb",
};

const COLOR_PRESET_ALIASES: Record<string, AdminColorPresetCanonical> = {
  BLACK: "NOIR",
  WHITE: "BLANC",
  "KING BLUE": "ROYAL BLUE",
  "BLEU ROI": "ROYAL BLUE",
};

/** Libellés français · alignés parseur + boutique (jersey, COLOR_RULES). */
const FRENCH_LABEL_BY_PRESET: Record<AdminColorVariant, string> = {
  NOIR: "Noir",
  BLACK: "Noir",
  BLANC: "Blanc",
  WHITE: "Blanc",
  VERT: "Vert",
  ROUGE: "Rouge",
  GRIS: "Gris",
  "GRIS CHINÉ": "Gris chiné",
  "KING BLUE": "Bleu roi",
  PINK: "Rose",
  "ROYAL BLUE": "Bleu royal",
  "BLEU ROI": "Bleu roi",
  "JAUNE FLUO": "Jaune fluo",
  PURPLE: "Violet",
  CHOCOLAT: "Chocolat",
  ZENITH: "Zenith",
};

export type DingryColorPresetRow = {
  /** Valeur CRM / `colorDeclinations` (canonical preset). */
  presetKey: AdminColorVariant;
  labelFr: string;
  hex: string;
  /** Clé `product_options.option_key` / `color` (existant : normalizeOptionKey). */
  optionKey: string;
  /** Abréviation officielle CRM / SKU / R2 (ex. `BLK`, `ROY`, `HGY`). */
  techCode: string;
};

/** Valeur stockée en `colorDeclinations` — toujours clé canonique si alias connu. */
export function canonicalColorDeclinationValue(raw: string): string {
  return normalizeCanonicalColorPreset(raw) ?? raw.trim();
}

export function colorDeclinationsCanonicallyEqual(a: string, b: string): boolean {
  return (
    canonicalColorDeclinationValue(a).toUpperCase() ===
    canonicalColorDeclinationValue(b).toUpperCase()
  );
}

export function normalizeCanonicalColorPreset(raw: string): AdminColorPresetCanonical | undefined {
  const upper = raw.trim().toUpperCase() as AdminColorVariant;
  if ((ADMIN_COLOR_PRESETS_CANONICAL as readonly string[]).includes(upper)) {
    return upper as AdminColorPresetCanonical;
  }
  return COLOR_PRESET_ALIASES[upper] ?? COLOR_PRESET_ALIASES[raw.trim().toUpperCase()];
}

export function findColorPresetRow(raw: string): DingryColorPresetRow | undefined {
  const canonical = normalizeCanonicalColorPreset(raw);
  if (!canonical) return undefined;
  return DINGRY_COLOR_PRESETS.find((p) => p.presetKey === canonical);
}

export function techCodeForColorPreset(raw: string): string {
  return colorAbbrevFromDeclinationLabel(raw);
}

function hexForPreset(preset: AdminColorVariant): string {
  return (
    VARIANT_SWATCH_HEX[preset] ??
    swatchHexForVariant(preset) ??
    SWATCH_HEX_ALIASES[preset] ??
    "#27272a"
  );
}

export const DINGRY_COLOR_PRESETS: readonly DingryColorPresetRow[] = ADMIN_COLOR_PRESETS_CANONICAL.map(
  (presetKey) => {
    const optionKey = normalizeOptionKey(presetKey);
    return {
      presetKey,
      labelFr: FRENCH_LABEL_BY_PRESET[presetKey],
      hex: hexForPreset(presetKey),
      optionKey,
      techCode: colorAbbrevFromDeclinationLabel(presetKey),
    };
  },
);

export function frenchLabelForColorPreset(raw: string): string {
  const key = raw.trim().toUpperCase() as AdminColorVariant;
  const row = DINGRY_COLOR_PRESETS.find((p) => p.presetKey === key);
  if (row) return row.labelFr;
  const hex = adminSwatchHex(raw);
  if (hex) {
    const match = DINGRY_COLOR_PRESETS.find((p) => p.hex.toLowerCase() === hex.toLowerCase());
    if (match) return match.labelFr;
  }
  return raw.trim();
}

export function adminSwatchHex(raw: string): string | null {
  const fromCore = swatchHexForVariant(raw);
  if (fromCore) return fromCore;
  const key = raw.trim().toUpperCase().replace(/\s+/g, " ");
  const alias = SWATCH_HEX_ALIASES[key];
  if (alias) return alias;
  return null;
}

export function adminSwatchStyle(raw: string): { backgroundColor: string; boxShadow?: string } {
  const key = raw.trim().toUpperCase().replace(/\s+/g, " ");
  const hex = adminSwatchHex(raw);
  if (hex) {
    const light =
      key === "BLANC" || key === "WHITE" || hex === "#f4f4f5" || hex === "#fafaf9";
    return {
      backgroundColor: hex,
      boxShadow: light
        ? "inset 0 0 0 1px rgba(120,113,108,0.45)"
        : "inset 0 1px 0 rgba(255,255,255,0.2)",
    };
  }
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(h) % 360;
  return { backgroundColor: `hsl(${hue} 36% 42%)` };
}

export function isKnownAdminColorPreset(raw: string): boolean {
  const key = raw.trim().toUpperCase();
  return DINGRY_COLOR_PRESETS.some((p) => p.presetKey === key);
}

export type ColorDeclinationBackendFields = {
  optionKey: string;
  variantSku: string;
  imageBlobPathname: string;
  altText: string;
};

/** Champs auto `product_options` (SKU marketing, R2, alt SEO) — sans saisie manuelle. */
export function buildColorDeclinationBackendFields(input: {
  productId: string;
  productName: string;
  parentSku: string;
  colorLabel: string;
}): ColorDeclinationBackendFields {
  const colorLabel = input.colorLabel.trim();
  const optionKey = normalizeOptionKey(colorLabel);
  const abbrev = colorAbbrevFromDeclinationLabel(colorLabel);
  const labelFr = frenchLabelForColorPreset(colorLabel);
  return {
    optionKey,
    variantSku: buildDingryVariantSku(input.parentSku, abbrev),
    imageBlobPathname: dingryR2VariantObjectKey(input.productId, input.productName, abbrev),
    altText: buildVariantAltText(input.productName, labelFr),
  };
}
