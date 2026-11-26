import {
  DEFAULT_PRODUCT_BRAND,
  DEFAULT_PRODUCT_COLLECTION,
  normalizeProductCategory,
  type Brand,
  type ProductCategory,
  type ProductCollection,
} from "@/lib/admin/types";
import { DINGRY_MADA_COLLECTION } from "@/lib/shop-brand-page-config";

/** `MARQUE-TYPE-MODELE` — clé de regroupement coloris / tailles. */
export type SkuModelRef = `${SkuMarqueCode}-${SkuTypeCode}-${string}`;

export const SKU_MARQUE_CODES = ["DIN", "DMA", "FYM", "RTS"] as const;
export type SkuMarqueCode = (typeof SKU_MARQUE_CODES)[number];

export const SKU_TYPE_CODES = [
  "CAP",
  "PUL",
  "TSH",
  "HOO",
  "ZIP",
  "CRW",
  "JER",
  "PAN",
  "CRO",
] as const;
export type SkuTypeCode = (typeof SKU_TYPE_CODES)[number];

export const SKU_COLORIS_CODES = [
  "NOI",
  "BLA",
  "ROU",
  "BEI",
  "VER",
  "GRI",
  "CHO",
  "BLE",
  "ORA",
  "VIO",
  "JFL",
  "ZEN",
  "PNK",
  "CHA",
] as const;
export type SkuColorisCode = (typeof SKU_COLORIS_CODES)[number];

export const SKU_TAILLE_CODES = ["XS", "S", "M", "L", "XL", "XXL", "U"] as const;
export type SkuTailleCode = (typeof SKU_TAILLE_CODES)[number];

export type SkuParts = {
  marque: SkuMarqueCode;
  type: SkuTypeCode;
  modele: string;
  coloris: SkuColorisCode;
  taille: SkuTailleCode;
};

const THREE_BLOCK = /^[A-Z]{3}$/;
const MODEL_REF_PATTERN =
  /^(DIN|DMA|FYM|RTS)-(CAP|PUL|TSH|HOO|ZIP|CRW|JER|PAN|CRO)-([A-Z]{3})$/;
const SKU_PATTERN =
  /^(DIN|DMA|FYM|RTS)-(CAP|PUL|TSH|HOO|ZIP|CRW|JER|PAN|CRO)-([A-Z]{3})-([A-Z]{3})-(XS|S|M|L|XL|XXL|U)$/;

const SKU_MARQUE_SET = new Set<string>(SKU_MARQUE_CODES);
const SKU_TYPE_SET = new Set<string>(SKU_TYPE_CODES);
const SKU_COLORIS_SET = new Set<string>(SKU_COLORIS_CODES);
const SKU_TAILLE_SET = new Set<string>(SKU_TAILLE_CODES);

/** Libellés CRM / déclinaisons → code coloris SKU (3 lettres). */
const COLOR_LABEL_TO_SKU_COLORIS: Record<string, SkuColorisCode> = {
  NOIR: "NOI",
  BLACK: "NOI",
  BLANC: "BLA",
  WHITE: "BLA",
  ROUGE: "ROU",
  RED: "ROU",
  BEIGE: "BEI",
  VERT: "VER",
  GREEN: "VER",
  GRIS: "GRI",
  GREY: "GRI",
  GRAY: "GRI",
  "GRIS CHINE": "GRI",
  "GRIS CHINÉ": "GRI",
  CHOCOLAT: "CHO",
  BROWN: "CHO",
  BLEU: "BLE",
  BLUE: "BLE",
  "BLEU ROI": "BLE",
  "ROYAL BLUE": "BLE",
  "KING BLUE": "BLE",
  ORANGE: "ORA",
  PURPLE: "VIO",
  VIOLET: "VIO",
  PINK: "PNK",
  ROSE: "PNK",
  "JAUNE FLUO": "JFL",
  ZENITH: "ZEN",
  CHARCOAL: "CHA",
};

/** Abréviations CRM (`BLK`, `RED`…) → coloris SKU 3 lettres. */
const COLOR_ABBREV_TO_SKU_COLORIS: Record<string, SkuColorisCode> = {
  BLK: "NOI",
  WHT: "BLA",
  RED: "ROU",
  BEI: "BEI",
  GRN: "VER",
  GRY: "GRI",
  HGY: "GRI",
  BRN: "CHO",
  ROY: "BLE",
  ORG: "ORA",
  VIO: "VIO",
  PNK: "PNK",
  YLW: "JFL",
  ZTH: "ZEN",
  STD: "NOI",
};

export function skuHasForbiddenChars(raw: string): boolean {
  if (!raw.trim()) return true;
  if (/\s/.test(raw)) return true;
  if (/[a-z]/.test(raw)) return true;
  if (/\p{M}/u.test(raw.normalize("NFD"))) return true;
  return false;
}

export function normalizeSkuStrict(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, "");
}

export function isValidSku(raw: string): boolean {
  return parseSku(raw) !== null;
}

export function parseSku(raw: string): SkuParts | null {
  if (skuHasForbiddenChars(raw)) return null;
  const normalized = normalizeSkuStrict(raw);
  const match = SKU_PATTERN.exec(normalized);
  if (!match) return null;
  const [, marque, type, modele, coloris, taille] = match;
  if (!marque || !type || !modele || !coloris || !taille) return null;
  if (!SKU_MARQUE_SET.has(marque) || !SKU_TYPE_SET.has(type)) return null;
  if (!SKU_COLORIS_SET.has(coloris) || !SKU_TAILLE_SET.has(taille)) return null;
  if (!THREE_BLOCK.test(modele)) return null;
  return {
    marque: marque as SkuMarqueCode,
    type: type as SkuTypeCode,
    modele,
    coloris: coloris as SkuColorisCode,
    taille: taille as SkuTailleCode,
  };
}

export function buildSku(parts: SkuParts): string {
  const modele = parts.modele.trim().toUpperCase();
  if (!THREE_BLOCK.test(modele)) {
    throw new Error("Code modèle invalide (3 lettres A–Z).");
  }
  if (!SKU_MARQUE_SET.has(parts.marque) || !SKU_TYPE_SET.has(parts.type)) {
    throw new Error("Code marque ou type invalide.");
  }
  if (!SKU_COLORIS_SET.has(parts.coloris) || !SKU_TAILLE_SET.has(parts.taille)) {
    throw new Error("Code coloris ou taille invalide.");
  }
  return `${parts.marque}-${parts.type}-${modele}-${parts.coloris}-${parts.taille}`;
}

export function getModelRef(raw: string): SkuModelRef | null {
  const parsed = parseSku(raw);
  if (parsed) return `${parsed.marque}-${parsed.type}-${parsed.modele}`;
  const model = parseModelRef(raw);
  if (!model) return null;
  return `${model.marque}-${model.type}-${model.modele}`;
}

export function parseModelRef(raw: string): {
  marque: SkuMarqueCode;
  type: SkuTypeCode;
  modele: string;
} | null {
  if (skuHasForbiddenChars(raw)) return null;
  const normalized = normalizeSkuStrict(raw);
  const match = MODEL_REF_PATTERN.exec(normalized);
  if (!match) return null;
  const [, marque, type, modele] = match;
  if (!marque || !type || !modele) return null;
  if (!SKU_MARQUE_SET.has(marque) || !SKU_TYPE_SET.has(type) || !THREE_BLOCK.test(modele)) return null;
  return {
    marque: marque as SkuMarqueCode,
    type: type as SkuTypeCode,
    modele,
  };
}

export function isValidModelRef(raw: string): boolean {
  return parseModelRef(raw) !== null;
}

export function buildModelRef(
  marque: SkuMarqueCode,
  type: SkuTypeCode,
  modele: string,
): SkuModelRef {
  const code = modele.trim().toUpperCase();
  if (!THREE_BLOCK.test(code)) throw new Error("Code modèle invalide.");
  return `${marque}-${type}-${code}`;
}

export function brandToSkuMarqueCode(
  brand: Brand | undefined,
  collection?: ProductCollection,
): SkuMarqueCode | null {
  const normalizedBrand = brand ?? "DINGRY";
  if (normalizedBrand === "DINGRY" && collection === DINGRY_MADA_COLLECTION) return "DMA";
  if (normalizedBrand === "DINGRY") return "DIN";
  if (normalizedBrand === "FYMA") return "FYM";
  if (normalizedBrand === "ROCK THE STREET") return "RTS";
  return null;
}

export function categoryToSkuTypeCode(category: string): SkuTypeCode | null {
  const cat = normalizeProductCategory(category) as ProductCategory;
  const map: Record<ProductCategory, SkuTypeCode> = {
    Caps: "CAP",
    Hoodies: "HOO",
    Hoodzip: "ZIP",
    Crewnecks: "CRW",
    "T-shirts": "TSH",
    Jerseys: "JER",
    Pants: "PAN",
    "Crop tops": "CRO",
  };
  return map[cat] ?? null;
}

/** Sweat / pull catalogue → `PUL` si besoin explicite (hors types admin). */
export function categoryToSkuTypeCodeLoose(category: string): SkuTypeCode | null {
  const direct = categoryToSkuTypeCode(category);
  if (direct) return direct;
  const upper = category.trim().toUpperCase();
  if (upper.includes("SWEAT") || upper.includes("PULL")) return "PUL";
  return null;
}

export function colorTokenToSkuColorisCode(token: string): SkuColorisCode | null {
  const key = token.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
  if (COLOR_ABBREV_TO_SKU_COLORIS[key]) return COLOR_ABBREV_TO_SKU_COLORIS[key];
  return colorLabelToSkuColorisCode(token);
}

export function colorLabelToSkuColorisCode(label: string): SkuColorisCode | null {
  const key = label
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
  if (COLOR_LABEL_TO_SKU_COLORIS[key]) return COLOR_LABEL_TO_SKU_COLORIS[key];
  const compact = key.replace(/\s+/g, " ");
  if (COLOR_LABEL_TO_SKU_COLORIS[compact]) return COLOR_LABEL_TO_SKU_COLORIS[compact];
  return null;
}

export function detectedSkuColorisExtensions(): readonly SkuColorisCode[] {
  return SKU_COLORIS_CODES.filter((code) => !["NOI", "BLA", "ROU", "BEI"].includes(code));
}

export function defaultSkuTailleForCategory(category: ProductCategory): SkuTailleCode {
  return category === "Caps" ? "U" : "M";
}

export function buildVariantSkuFromModelRef(
  modelRef: string,
  colorToken: string,
  taille: SkuTailleCode = "M",
): string | null {
  const model = parseModelRef(modelRef);
  if (!model) return null;
  const coloris = colorTokenToSkuColorisCode(colorToken);
  if (!coloris) return null;
  return buildSku({ ...model, coloris, taille });
}

function modeleHintFromName(productName: string): string | null {
  const letters = productName
    .toUpperCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^A-Z]/g, "");
  if (letters.length < 3) return null;
  return letters.slice(0, 3);
}

export function collectUsedModeleCodes(
  existingSkus: readonly string[],
  scope?: { marque: SkuMarqueCode; type: SkuTypeCode },
): Set<string> {
  const used = new Set<string>();
  for (const raw of existingSkus) {
    const ref = getModelRef(raw);
    if (!ref) continue;
    const parsed = parseModelRef(ref);
    if (!parsed) continue;
    if (scope && (parsed.marque !== scope.marque || parsed.type !== scope.type)) continue;
    used.add(parsed.modele);
  }
  return used;
}

function incrementModeleCode(code: string): string | null {
  if (!THREE_BLOCK.test(code)) return null;
  const chars = [code.charCodeAt(0), code.charCodeAt(1), code.charCodeAt(2)];
  for (let i = 2; i >= 0; i -= 1) {
    const slot = chars[i];
    if (slot === undefined) continue;
    if (slot < 90) {
      chars[i] = slot + 1;
      for (let j = i + 1; j < 3; j += 1) {
        const next = chars[j];
        if (next !== undefined) chars[j] = 65;
      }
      return String.fromCharCode(chars[0]!, chars[1]!, chars[2]!);
    }
  }
  return null;
}

function lexicographicMaxModele(used: ReadonlySet<string>): string | null {
  let max: string | null = null;
  for (const code of used) {
    if (!THREE_BLOCK.test(code)) continue;
    if (!max || code > max) max = code;
  }
  return max;
}

export function allocateModeleCode(used: ReadonlySet<string>, hint?: string | null): string {
  const normalizedHint = hint?.trim().toUpperCase();
  if (normalizedHint && THREE_BLOCK.test(normalizedHint) && !used.has(normalizedHint)) {
    return normalizedHint;
  }
  if (used.size > 0) {
    const max = lexicographicMaxModele(used);
    if (max) {
      let candidate: string | null = incrementModeleCode(max);
      while (candidate && used.has(candidate)) {
        candidate = incrementModeleCode(candidate);
      }
      if (candidate) return candidate;
    }
  }
  for (let a = 65; a <= 90; a += 1) {
    for (let b = 65; b <= 90; b += 1) {
      for (let c = 65; c <= 90; c += 1) {
        const code = String.fromCharCode(a, b, c);
        if (!used.has(code)) return code;
      }
    }
  }
  return "ZZZ";
}

export function newProductModelRef(input: {
  category: ProductCategory;
  existingSkus: readonly string[];
  brand?: Brand;
  collection?: ProductCollection;
  productName?: string;
}): SkuModelRef {
  const marque = brandToSkuMarqueCode(
    input.brand ?? DEFAULT_PRODUCT_BRAND,
    input.collection ?? DEFAULT_PRODUCT_COLLECTION,
  );
  const type = categoryToSkuTypeCode(input.category);
  if (!marque || !type) {
    throw new Error("Impossible de générer une réf. modèle pour cette marque ou catégorie.");
  }
  const used = collectUsedModeleCodes(input.existingSkus, { marque, type });
  const modele = allocateModeleCode(used, modeleHintFromName(input.productName ?? ""));
  return buildModelRef(marque, type, modele);
}