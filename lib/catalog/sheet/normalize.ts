/** Normalisation feuille → SKU / marque / tailles (seuls 4 symboles exportés via `catalog-sheet.ts`). */
import { normalizeProductBrand, normalizeProductCategory, type Brand, type ProductSize } from "@/lib/admin/types";
import { isValidSku, parseSku, type SkuTailleCode } from "@/lib/sku";

/** Nettoyage codes catalogue (`SKU`, réf. modèle). */
export function normalizeCatalogSheetCodeToken(raw: string): string {
  return raw
    .trim()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[\u2010-\u2015\u2212–—]/g, "-")
    .replace(/_/g, "-")
    .replace(/\s+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase();
}

/** SKU feuille → canonique (5 blocs, `TU` final → `U`). */
export function normalizeCatalogSheetSku(raw: string): string {
  let sku = normalizeCatalogSheetCodeToken(raw);
  const parts = sku.split("-").filter(Boolean);
  if (parts.length === 5 && parts[4] === "TU") parts[4] = "U";
  sku = parts.join("-");
  if (sku.endsWith("-TU")) sku = `${sku.slice(0, -3)}-U`;
  return sku;
}

export function normalizeCatalogSheetModelRef(raw: string): string {
  return normalizeCatalogSheetCodeToken(raw);
}

const BRAND_FROM_SKU_MARQUE: Record<string, Brand> = {
  FYM: "FYMA",
  DIN: "DINGRY",
  DMA: "DINGRY",
  RTS: "ROCK THE STREET",
};

function normalizeBrandLabelKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Marque feuille → marque admin (tolérant casse / alias). */
export function normalizeCatalogSheetBrand(raw: string, sku?: string): Brand | null {
  const label = normalizeBrandLabelKey(raw);
  if (label) {
    if (label === "fyma" || label === "fym") return "FYMA";
    if (label === "dingry" || label === "din") return "DINGRY";
    if (label.includes("mada") && label.includes("dingry")) return "DINGRY";
    if (label === "rts" || label === "rock the street") return "ROCK THE STREET";
    const trimmed = raw.trim();
    if (trimmed.toUpperCase() === trimmed && normalizeProductBrand(trimmed) === trimmed) {
      return normalizeProductBrand(trimmed);
    }
  }
  const normalizedSku = sku ? normalizeCatalogSheetSku(sku) : "";
  const parsed = normalizedSku && isValidSku(normalizedSku) ? parseSku(normalizedSku) : null;
  if (parsed && BRAND_FROM_SKU_MARQUE[parsed.marque]) return BRAND_FROM_SKU_MARQUE[parsed.marque]!;
  return null;
}

const COLOR_DISPLAY_ALIASES: Record<string, string> = {
  noir: "Noir",
  noire: "Noir",
  black: "Noir",
  blanc: "Blanc",
  blanche: "Blanc",
  white: "Blanc",
  rouge: "Rouge",
  red: "Rouge",
  beige: "Beige",
  vert: "Vert",
  green: "Vert",
  gris: "Gris",
  grey: "Gris",
  gray: "Gris",
};

export function normalizeCatalogSheetColorDisplay(raw: string): string {
  const key = normalizeBrandLabelKey(raw).replace(/\s+/g, " ");
  if (COLOR_DISPLAY_ALIASES[key]) return COLOR_DISPLAY_ALIASES[key]!;
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/** Parse prix multi-formats Excel (`60,00 €`, `1 200,50 EUR`, `60€`). */
export function parseCatalogSheetUnitPrice(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let normalized = trimmed
    .replace(/\u00a0/g, "")
    .replace(/\s/g, "")
    .replace(/€|eur|euro/gi, "");
  const digitChunk = normalized.match(/-?[\d.,]+/);
  if (!digitChunk?.[0]) return null;
  let num = digitChunk[0];
  if (num.includes(",") && num.includes(".")) {
    if (num.lastIndexOf(",") > num.lastIndexOf(".")) {
      num = num.replace(/\./g, "").replace(",", ".");
    } else {
      num = num.replace(/,/g, "");
    }
  } else if (num.includes(",")) {
    const parts = num.split(",");
    if (parts.length === 2 && (parts[1]?.length ?? 0) <= 2) {
      num = `${parts[0]}.${parts[1]}`;
    } else {
      num = num.replace(/,/g, "");
    }
  }
  const n = Number.parseFloat(num);
  if (!Number.isFinite(n) || n <= 0 || n > 99_999) return null;
  return Number.isInteger(n) ? n : Math.round(n * 100) / 100;
}

const SIZE_INPUT_TO_SKU: Record<string, SkuTailleCode> = {
  tu: "U",
  u: "U",
  unique: "U",
  "taille unique": "U",
  os: "U",
  "one size": "U",
  xs: "XS",
  s: "S",
  m: "M",
  l: "L",
  xl: "XL",
  xxl: "XXL",
  "2xl": "XXL",
  "3xl": "XXL",
  xxxl: "XXL",
};

/** Taille feuille / CRM → code SKU (`TU` / `TAILLE UNIQUE` → `U`). */
export function catalogDisplaySizeToSkuTaille(size: string): SkuTailleCode | null {
  const stripped = size
    .trim()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[.\s]+/g, " ")
    .trim();
  const lower = stripped.toLowerCase();
  if (SIZE_INPUT_TO_SKU[lower]) return SIZE_INPUT_TO_SKU[lower]!;
  const upper = stripped.toUpperCase().replace(/\s+/g, "");
  if (upper === "TAILLEUNIQUE" || upper === "ONESIZE") return "U";
  if (SIZE_INPUT_TO_SKU[upper.toLowerCase()]) return SIZE_INPUT_TO_SKU[upper.toLowerCase()]!;
  const allowed: readonly SkuTailleCode[] = ["XS", "S", "M", "L", "XL", "XXL", "U"];
  return (allowed as readonly string[]).includes(upper) ? (upper as SkuTailleCode) : null;
}

/** Code SKU → libellé taille boutique / admin (`U` → `TU`). */
export function skuTailleToCatalogDisplaySize(taille: SkuTailleCode): ProductSize {
  return taille === "U" ? "TU" : taille;
}
