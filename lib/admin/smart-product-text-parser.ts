import { trimStoryField } from "@/lib/admin/product-story";
import { normalizePantWaistSize } from "@/lib/admin/pant-waist";
import { ADMIN_COLOR_VARIANTS, isPantsCategory } from "@/lib/admin/product-variant-presets";
import { ADMIN_CATEGORY_SIZES, type ProductCategory, type ProductSize } from "@/lib/admin/types";

export type SmartParseFieldId =
  | "category"
  | "name"
  | "description"
  | "materials"
  | "fabrication"
  | "limitedEdition"
  | "price"
  | "sizes"
  | "variant";

/** Libellés pour retour visuel « champs remplis ». */
export const SMART_PARSE_FIELD_LABELS: Record<SmartParseFieldId, string> = {
  category: "Catégorie",
  name: "Nom / Titre",
  description: "Description",
  materials: "Matières",
  fabrication: "Fabrication",
  limitedEdition: "Édition limitée",
  price: "Prix (€)",
  sizes: "Tailles",
  variant: "Variante / couleur",
};

export type SmartProductParseResult = {
  /** Catégorie déduite du texte (sinon le fallback formulaire est utilisé). */
  detectedCategory?: ProductCategory;
  name?: string;
  description?: string;
  materials?: string;
  fabrication?: string;
  limitedEdition?: string;
  price?: string;
  sizes?: ProductSize[];
  /** Coloris CRM (preset DINGRY) si reconnu. */
  variantColor?: string;
  filled: SmartParseFieldId[];
};

/** Pas de \b après € (symbole non « mot » JS → échec avant fin de ligne). */
const RE_PRICE = /\b(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|EUR|euros?)(?=\s|$|[.,;:!?])/i;
const RE_MATERIAL_LINE =
  /%|g\/m²|g\/m2|g\/m\?|gsm|grammage|mg\/m²|mg\/m2|kg|oz\/|coton|polyester|polyamide|laine|viscose|élasthanne|elasthanne|lin|soie|nylon|acrylique|fleece|molleton/i;
const RE_FABRICATION_LINE = /fabriqué|made\s+in|confectionn|importé|produit\s+en|manufacturé|cousu/i;
const RE_LIMITED_LINE = /édition\s+limitée|limited\s+edition|numérotée|série\s+limitée|exemplaires?\s+limit/i;
const RE_TITLE_NOISE = /^(?:prix|price|tailles?|sizes?)\s*[:\-]/i;

/**
 * Ordre décroissant (évite que « XL » matche dans « 2XL »).
 * XXL / XXXL (variantes fournisseur) → 2XL / 3XL grille CRM.
 */
const LETTER_SIZE_SCAN: readonly { pattern: string; size: ProductSize }[] = [
  { pattern: "5XL", size: "5XL" },
  { pattern: "4XL", size: "4XL" },
  { pattern: "3XL", size: "3XL" },
  { pattern: "XXXL", size: "3XL" },
  { pattern: "2XL", size: "2XL" },
  { pattern: "XXL", size: "2XL" },
  { pattern: "XL", size: "XL" },
  { pattern: "L", size: "L" },
  { pattern: "M", size: "M" },
  { pattern: "S", size: "S" },
  { pattern: "XS", size: "XS" },
  { pattern: "XXS", size: "XXS" },
  { pattern: "TU", size: "TU" },
];

type CategoryRule = {
  category: ProductCategory;
  /** Testé sur les N premiers caractères en majuscules. */
  test: (headUpper: string) => boolean;
};

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: "Hoodies zippés",
    test: (h) =>
      /\b(ZIP\s*HOO?DIE|HOO?DIE\s*ZIP|SWEAT\s*ZIP|PULL\s*ZIP)\b/.test(h) ||
      (h.includes("HOODIE") && h.includes("ZIP")) ||
      (h.includes("SWEAT") && h.includes("ZIPP")),
  },
  { category: "Hoodies", test: (h) => /\b(HOO?DIE|HOO?DIS|PULL\s*CAPUCHE|SWEAT\s*SHIRT)\b/.test(h) },
  { category: "Crewnecks", test: (h) => /\b(CREW\s*NECK|CREWNECK|SWEAT\s*COL\s*ROND)\b/.test(h) },
  { category: "T-shirts", test: (h) => /\b(T[\s\-]?SHIRT|TEE[\s\-]?SHIRT|\bTEE\b|TSHIRT)\b/.test(h) },
  { category: "Jerseys", test: (h) => /\b(JERSEY|MAILLOT)\b/.test(h) },
  {
    category: "Pants",
    test: (h) =>
      /\b(PANTS?\b|JEAN|PANTALON|CARGO|CHINO|JOGGER|SWEAT\s*PANT)/.test(h) ||
      /\bPANT\s/.test(h),
  },
  { category: "Crop tops", test: (h) => /\bCROP\s*(TOP|TEE|HOODIE)?\b/.test(h) },
  {
    category: "Caps",
    test: (h) => /\b(CAP|CASQUETTE|SNAPBACK|TRUCKER|BONNET)\b/.test(h),
  },
];

/**
 * Heuristique sur le début du texte + titre — première règle qui matche.
 */
export function detectCategoryFromText(raw: string): ProductCategory | undefined {
  const normalized = normalizePasteText(raw);
  if (!normalized) return undefined;
  const lines = normalized
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const firstLine = lines[0] ?? "";
  const head = `${firstLine}\n${normalized.slice(0, 600)}`.toUpperCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.test(head)) return rule.category;
  }
  return undefined;
}

/** Corrige encodage (g/m? → g/m²), espaces insécables. */
function normalizePasteText(raw: string): string {
  let t = raw.replace(/\u00a0/g, " ").replace(/\r\n/g, "\n");
  t = t.replace(/g\/m\s*\?/gi, "g/m²");
  t = t.replace(/m\?²/gi, "m²");
  t = t.replace(/m2\b/gi, "m²");
  return t.trim();
}

/** Notes de bas de page / avertissements (* … 4XL-5XL …). */
function stripLeadingAsteriskFootnotes(text: string): string {
  return text
    .split("\n")
    .filter((line) => !/^\s*\*/.test(line))
    .join("\n");
}

function formatPriceEuro(raw: string): string | undefined {
  const n = Number.parseFloat(raw.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0 || n > 99_999) return undefined;
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 100) / 100);
}

export function extractEuroPrice(text: string): string | undefined {
  const m = text.match(RE_PRICE);
  if (!m?.[1]) return undefined;
  return formatPriceEuro(m[1]);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Tailles texte : ordre canonique, uniquement celles autorisées pour la catégorie.
 * Ignore les lignes commençant par * (notes).
 */
function extractLetterSizes(text: string, allowed: readonly ProductSize[]): ProductSize[] {
  const clean = stripLeadingAsteriskFootnotes(text);
  const found = new Set<ProductSize>();
  for (const { pattern, size } of LETTER_SIZE_SCAN) {
    if (!allowed.includes(size)) continue;
    const re = new RegExp(`\\b${escapeRegExp(pattern)}\\b`, "i");
    if (re.test(clean)) found.add(size);
  }
  const natural = [
    "XXS",
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "2XL",
    "3XL",
    "4XL",
    "5XL",
    "TU",
  ] as const satisfies readonly ProductSize[];
  const idx = new Map<ProductSize, number>();
  natural.forEach((s, i) => {
    idx.set(s, i);
  });
  return [...found].sort((a, b) => (idx.get(a) ?? 99) - (idx.get(b) ?? 99));
}

function extractPantWaists(text: string): ProductSize[] {
  const clean = stripLeadingAsteriskFootnotes(text);
  const seen = new Set<ProductSize>();
  for (const m of clean.matchAll(/\b(2[8-9]|3[0-9]|4[0-2])\b/g)) {
    const w = normalizePantWaistSize(m[1] ?? "");
    if (w) seen.add(w);
  }
  return Array.from(seen).sort((a, b) => Number(a) - Number(b));
}

const COLOR_SYNONYMS: readonly { re: RegExp; variant: string }[] = [
  { re: /\bheather\s+grey\b/i, variant: "GRIS CHINÉ" },
  { re: /\bgris\s+chiné\b/i, variant: "GRIS CHINÉ" },
  { re: /\bgris\s+chine\b/i, variant: "GRIS CHINÉ" },
  { re: /\broyal\s+blue\b/i, variant: "ROYAL BLUE" },
  { re: /\bbleu\s+roi\b/i, variant: "BLEU ROI" },
  { re: /\bking\s+blue\b/i, variant: "KING BLUE" },
  { re: /\bjaune\s+fluo\b/i, variant: "JAUNE FLUO" },
  { re: /\bnoir\b/i, variant: "NOIR" },
  { re: /\bblack\b/i, variant: "BLACK" },
  { re: /\bblanc\b/i, variant: "BLANC" },
  { re: /\bwhite\b/i, variant: "WHITE" },
  { re: /\bvert\b/i, variant: "VERT" },
  { re: /\brouge\b/i, variant: "ROUGE" },
  { re: /\bgris\b/i, variant: "GRIS" },
  { re: /\brose\b/i, variant: "PINK" },
  { re: /\bviolet\b/i, variant: "PURPLE" },
  { re: /\bchocolat\b/i, variant: "CHOCOLAT" },
  { re: /\bzenith\b/i, variant: "ZENITH" },
];

/**
 * Première couleur reconnue (synonymes + liste preset DINGRY).
 */
function extractVariantColor(text: string): string | undefined {
  const head = `${text.slice(0, 1200)}`;
  for (const { re, variant } of COLOR_SYNONYMS) {
    if (re.test(head)) return variant;
  }
  const upper = head.toUpperCase();
  for (const preset of ADMIN_COLOR_VARIANTS) {
    const re = new RegExp(`\\b${escapeRegExp(preset)}\\b`, "i");
    if (re.test(upper)) return preset;
  }
  return undefined;
}

function looksLikeMaterialLine(line: string): boolean {
  return RE_MATERIAL_LINE.test(line);
}

function looksLikeFabricationLine(line: string): boolean {
  return RE_FABRICATION_LINE.test(line);
}

function looksLikeLimitedLine(line: string): boolean {
  return RE_LIMITED_LINE.test(line);
}

function isNoiseLine(line: string): boolean {
  if (RE_PRICE.test(line) && line.length < 40) return true;
  if (/^tailles?\s*[:\-]/i.test(line) && line.length < 80) return true;
  return false;
}

function normalizeStoryBody(s: string): string {
  return s.replace(/g\/m\s*\?/gi, "g/m²").replace(/\s+/g, " ").trim();
}

/**
 * Analyse un descriptif brut (collage) et remplit les champs CRM correspondants.
 * @param fallbackCategory Catégorie du formulaire si aucune détection fiable.
 */
export function parseSmartProductText(
  raw: string,
  fallbackCategory: ProductCategory,
): SmartProductParseResult {
  const filled: SmartParseFieldId[] = [];
  const text = normalizePasteText(raw);
  if (!text) return { filled: [] };

  const detectedCategory = detectCategoryFromText(text);
  const category = detectedCategory ?? fallbackCategory;
  if (detectedCategory !== undefined) filled.push("category");

  const allowedSizes = ADMIN_CATEGORY_SIZES[category];
  const pants = isPantsCategory(category);

  const textNoFootnotes = stripLeadingAsteriskFootnotes(text);
  const lines = textNoFootnotes
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let name: string | undefined;
  if (lines.length > 0) {
    const first = lines[0];
    if (first.length <= 140 && !RE_TITLE_NOISE.test(first) && !looksLikeMaterialLine(first)) {
      name = normalizeStoryBody(first);
      filled.push("name");
    }
  }

  const price = extractEuroPrice(text);
  if (price !== undefined) filled.push("price");

  const sizes: ProductSize[] = pants ? extractPantWaists(text) : extractLetterSizes(text, allowedSizes);
  if (sizes.length > 0) filled.push("sizes");

  let variantColor: string | undefined;
  if (!pants) {
    variantColor = extractVariantColor(text);
    if (variantColor !== undefined) filled.push("variant");
  }

  const materialLines: string[] = [];
  const fabricationLines: string[] = [];
  const limitedLines: string[] = [];
  const descriptionCandidates: string[] = [];

  const titleLine = name !== undefined ? lines[0] : null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (titleLine !== null && i === 0) continue;
    if (isNoiseLine(line)) continue;
    if (looksLikeLimitedLine(line)) {
      limitedLines.push(line);
      continue;
    }
    if (looksLikeFabricationLine(line) && !looksLikeMaterialLine(line)) {
      fabricationLines.push(line);
      continue;
    }
    if (looksLikeMaterialLine(line)) {
      materialLines.push(line);
      continue;
    }
    if (line.length >= 20 || /[.!?]$/.test(line)) {
      descriptionCandidates.push(line);
    } else if (line.length >= 8 && !/^\d/.test(line)) {
      descriptionCandidates.push(line);
    }
  }

  let materials: string | undefined;
  if (materialLines.length > 0) {
    materials = trimStoryField(materialLines.map((l) => normalizeStoryBody(l)).join("\n\n"));
    filled.push("materials");
  }

  let fabrication: string | undefined;
  if (fabricationLines.length > 0) {
    fabrication = trimStoryField(fabricationLines.map((l) => normalizeStoryBody(l)).join("\n\n"));
    filled.push("fabrication");
  }

  let limitedEdition: string | undefined;
  if (limitedLines.length > 0) {
    limitedEdition = trimStoryField(limitedLines.map((l) => normalizeStoryBody(l)).join("\n\n"));
    filled.push("limitedEdition");
  }

  let description: string | undefined;
  if (descriptionCandidates.length > 0) {
    description = trimStoryField(descriptionCandidates.map((l) => normalizeStoryBody(l)).join("\n\n"));
    filled.push("description");
  } else if (materialLines.length === 0 && lines.length > 1 && name !== undefined) {
    const rest = lines.slice(1).join("\n\n");
    const fallback = trimStoryField(normalizeStoryBody(rest));
    if (fallback.length >= 10) {
      description = fallback;
      filled.push("description");
    }
  }

  const result: SmartProductParseResult = { filled };
  if (detectedCategory !== undefined) result.detectedCategory = detectedCategory;
  if (name !== undefined) result.name = name;
  if (description !== undefined) result.description = description;
  if (materials !== undefined) result.materials = materials;
  if (fabrication !== undefined) result.fabrication = fabrication;
  if (limitedEdition !== undefined) result.limitedEdition = limitedEdition;
  if (price !== undefined) result.price = price;
  if (sizes.length > 0) result.sizes = sizes;
  if (variantColor !== undefined) result.variantColor = variantColor;

  return result;
}

export function summarizeSmartParseFilled(filled: readonly SmartParseFieldId[]): string {
  if (filled.length === 0) return "Smart collage · aucun champ détecté — ajuste le texte ou la catégorie.";
  const labels = filled.map((id) => SMART_PARSE_FIELD_LABELS[id]);
  return `Smart collage · champs remplis : ${labels.join(" · ")}.`;
}
