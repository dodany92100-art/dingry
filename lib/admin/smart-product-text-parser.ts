import {
  parseOfficialRoutingLine,
  stripCollageRoutingPrefix,
} from "@/lib/admin/smart-collage-routing";
import {
  materialStopCutApplied,
  splitAtMaterialStop,
  splitAtStoryStop,
} from "@/lib/admin/smart-collage-stop-tags";
import { trimStoryField } from "@/lib/admin/product-story";
import { normalizePantWaistSize } from "@/lib/admin/pant-waist";
import { isLikelySkuReference, normalizeSkuInput } from "@/lib/admin/product-sku";
import { ADMIN_COLOR_VARIANTS, isPantsCategory } from "@/lib/admin/product-variant-presets";
import {
  ADMIN_CATEGORY_SIZES,
  normalizeProductCategory,
  productCategoryFromCatalogSlug,
  type ProductCategory,
  type ProductPrintPlacement,
  type ProductSize,
} from "@/lib/admin/types";
import { matchCatalogCategoryInText } from "@/lib/catalog-category";

export type SmartParseFieldId =
  | "category"
  | "sku"
  | "name"
  | "description"
  | "materials"
  | "fabrication"
  | "limitedEdition"
  | "price"
  | "stock"
  | "sizes"
  | "variant"
  | "printPlacement";

export const SMART_PARSE_FIELD_LABELS: Record<SmartParseFieldId, string> = {
  category: "Catégorie",
  sku: "SKU / Référence",
  name: "Nom / Titre",
  description: "Description",
  materials: "Matières",
  fabrication: "Fabrication",
  limitedEdition: "Édition limitée",
  price: "Prix (€)",
  stock: "Stock",
  sizes: "Tailles",
  variant: "Variante / couleur",
  printPlacement: "Impression",
};

export type SmartProductParseResult = {
  detectedCategory?: ProductCategory;
  sku?: string;
  name?: string;
  description?: string;
  materials?: string;
  /** Grammage (g/m², gsm) — mappé sur `sizeGuide` CRM. */
  weight?: string;
  fabrication?: string;
  limitedEdition?: string;
  price?: string;
  stock?: string;
  sizes?: ProductSize[];
  variantColor?: string;
  printPlacement?: ProductPrintPlacement;
  filled: SmartParseFieldId[];
};

export type SmartParseDiagnostics = {
  blockCount: number;
  footnoteLinesSkipped: number;
};

export type MakerSemanticBlock = {
  key:
    | "category"
    | "title"
    | "color"
    | "sizes"
    | "price"
    | "stock"
    | "materials"
    | "description"
    | "fabrication"
    | "limitedEdition"
    | "printPlacement";
  label: string;
  value: string;
};

export type SmartProductParseOutput = SmartProductParseResult & {
  diagnostics: SmartParseDiagnostics;
  semanticBlocks: MakerSemanticBlock[];
};

/** Algorithme collage DINGRY — une règle par type de ligne (pas de scoring legacy). */
const RE_CATEGORY_LINE = /^(?:catégorie|categorie|categori|produit)\b/i;
const RE_CATEGORY_SHORT = /^cat\s*(?:[:：\-.–—])/i;
const RE_PRICE_SOFT = /(?:^|[^\d])(\d+(?:[.,]\d+)?)\s*(?:€|EUR|e|eur)(?:\s|$|[^\d\w])/i;
const RE_PRICE_LABEL = /(?:^|[\s\n])(?:prix|price)\s*[:\-.]?\s*(\d+(?:[.,]\d+)?)/i;
const RE_STOCK_LABEL =
  /(?:^|[\s\n])(?:qte|qt[eé]|quantit[eé]s?|quantity|stock)\s*[:：\-.]?\s*(\d{1,4})\b/iu;
const RE_REF = /\bref(?:\.|erence)?\b/i;
const RE_NOM = /\b(?:nom|name)\b/i;
const RE_TITRE = /\btitre(?:\s*nom)?\b/i;
/** argu, zrgi, story, desc… (ligne structurée — préfixe retiré via stripLabelPrefix). */
const RE_STORY_LABEL =
  /^(?:ardu|argu\w*|argi|zrgi|ar|story|desc(?:ription)?|argui|descr[i1l][p]*tions?|dsric?r?i?ptions?)\s*(?:[:\-.–—])/iu;
const RE_CARE_LINE =
  /\b(?:lavable|entretien|lavage|séchage|repasser|machine|soin|nettoyage|ne pas|repassage)\b/i;
const RE_GRAMMAGE = /\b(?:g\/m|gsm|grammage?|grammes?|grams?|densit[ée]|density|poids)\b/i;
const RE_GRAMMAGE_LABEL =
  /^(?:grammages?|grammes?|grams?|gsm|densit[ée]s?|density|poids)\s*$/i;
const RE_MATIERE_LABEL = /^(?:mat|mati[eè]res?)\s*$/i;
const RE_SIZE_LABEL = /^(?:tailles?|size|tzill)\s*(?:[:：\-.–—])/iu;
const RE_DENSITY_IN_LINE = /(\d+(?:[.,]\d+)?)\s*g\s*\/?\s*m(?:\s*[²2])?/i;
const RE_PERCENT = /%/;
const RE_COULEUR = /\bcouleur\b/i;
const RE_TAILLE = /\btailles?\b/i;

/** Scan univers produit si pas de ligne `catégorie:` / `produit:`. */
const CATEGORY_KEYWORDS: readonly { category: ProductCategory; patterns: readonly RegExp[]; weight: number }[] = [
  { category: "Hoodies zippés", patterns: [/\bhoodies?\s+zipp[ée]s?\b/i, /\bzip\s*hoodie\b/i], weight: 3 },
  { category: "Hoodies", patterns: [/\bhoodies?\b/i], weight: 2 },
  { category: "Crewnecks", patterns: [/\bcrew\s*necks?\b/i, /\bcrewneck\b/i], weight: 2 },
  { category: "Crop tops", patterns: [/\bcrop\s*tops?\b/i], weight: 2 },
  { category: "Jerseys", patterns: [/\bjerseys?\b/i, /\bmaillots?\b/i], weight: 2 },
  { category: "Caps", patterns: [/\bcaps?\b/i, /\bcasquettes?\b/i], weight: 2 },
  {
    category: "Pants",
    patterns: [/\bjogpants?\b/i, /\bjoggers?\b/i, /\bpants?\b/i, /\bpantalons?\b/i, /\bcargo\b/i],
    weight: 2,
  },
  {
    category: "T-shirts",
    patterns: [/\bt[\s\-]?shirts?\b/i, /\btee[\s\-]?shirts?\b/i, /\btees?\b/i],
    weight: 2,
  },
  {
    category: "Hoodies",
    patterns: [/\bsweat\s+[àa]\s+capuche\b/i, /\bsweatcapuche\b/i, /\bcapuche\b/i],
    weight: 2,
  },
  { category: "Crewnecks", patterns: [/\bsweats?\b/i, /\bpulls?\b/i, /\bcrew\b/i], weight: 1 },
];

const SEMANTIC_CLIP = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SIZE_ORDER: readonly ProductSize[] = [
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
];

const LETTER_SIZE_SCAN: readonly { pattern: string; size: ProductSize }[] = [
  { pattern: "5XL", size: "5XL" },
  { pattern: "4XL", size: "4XL" },
  { pattern: "3XL", size: "3XL" },
  { pattern: "XXXL", size: "3XL" },
  { pattern: "2XL", size: "2XL" },
  { pattern: "XXL", size: "2XL" },
  { pattern: "XL", size: "XL" },
  { pattern: "XS", size: "XS" },
  { pattern: "XXS", size: "XXS" },
  { pattern: "TU", size: "TU" },
  { pattern: "S", size: "S" },
  { pattern: "M", size: "M" },
  { pattern: "L", size: "L" },
];

export function normalizePasteText(raw: string): string {
  let t = raw.replace(/\u00a0/g, " ").replace(/\r\n/g, "\n");
  t = t.normalize("NFKC");
  t = t.replace(/g\s*\/\s*m\s*\?/gi, "g/m²");
  t = t.replace(/g\s*\/\s*m\s*2\b/gi, "g/m²");
  t = t.replace(/\bg\s*\/\s*m(?!\s*[²2?\d])/gi, "g/m²");
  t = t.replace(/[^\S\r\n]+/g, " ");
  return t.trim();
}

function linesFromText(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

const RE_EMBEDDED_ROUTE_CHUNK =
  /(?=(?:mat|mati[eè]re|prix|price|couleur|qte|qt[eé]|quantit[eé]|quantity|stock)\s*[:：])/iu;

/** Découpe `noir prix: 89 qte: 1` → tête + suite routée. */
function splitEmbeddedRoutingTail(value: string): { head: string; tail: string } {
  const t = value.trim();
  const parts = t.split(RE_EMBEDDED_ROUTE_CHUNK);
  if (parts.length <= 1) return { head: t, tail: "" };
  return { head: (parts[0] ?? "").trim(), tail: parts.slice(1).join("").trim() };
}

function formatPriceEuro(raw: string): string | undefined {
  const n = Number.parseFloat(raw.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0 || n > 99_999) return undefined;
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 100) / 100);
}

/** Stock CRM (entier 0–9999). */
function parseStockQuantity(raw: string): string | undefined {
  const trimmed = raw.trim();
  const match = trimmed.match(/(\d{1,4})\b/);
  if (!match?.[1]) return undefined;
  const n = Number.parseInt(match[1], 10);
  if (!Number.isInteger(n) || n < 0 || n > 9999) return undefined;
  return String(n);
}

export function extractEuroPrice(text: string): string | undefined {
  const m = text.match(RE_PRICE_SOFT);
  if (m?.[1]) return formatPriceEuro(m[1]);
  const m2 = text.match(RE_PRICE_LABEL);
  if (m2?.[1]) return formatPriceEuro(m2[1]);
  return undefined;
}

/** Retire les préfixes de routage (dictionnaire officiel). */
export function stripRoutingTagsFromValue(value: string): string {
  return stripCollageRoutingPrefix(value);
}

function formatRoutedGsmValue(raw: string): string {
  const cleaned = stripCollageRoutingPrefix(raw);
  const fromDensity = extractGrammageFromLine(cleaned);
  if (fromDensity) return fromDensity;
  const n = cleaned.match(/(\d+(?:[.,]\d+)?)/);
  if (!n?.[1]) return cleaned;
  return `${n[1].replace(",", ".")} g/m²`;
}

function stripLabelPrefix(line: string, labelRe: RegExp): string {
  const trimmed = line.trim();
  const lineStart = new RegExp(`^\\s*(?:${labelRe.source})\\s*(?:[:\\-.–—])?\\s*`, labelRe.flags);
  let peeled = trimmed;
  if (lineStart.test(trimmed)) {
    peeled = trimmed.replace(lineStart, "");
  } else {
    const m = trimmed.match(labelRe);
    if (!m || m.index === undefined) return stripRoutingTagsFromValue(trimmed);
    peeled = trimmed.slice(m.index + m[0].length).replace(/^\s*[:\-.–—]\s*/, "");
  }
  return stripRoutingTagsFromValue(peeled);
}

function categoryFromLineValue(raw: string): ProductCategory | undefined {
  const token = raw.trim();
  if (!token) return undefined;
  const normalized = normalizeProductCategory(token);
  if (normalized !== "T-shirts" || /\bt-?shirts?\b/i.test(token)) return normalized;
  if (token.length >= 3) {
    const upper = token.toUpperCase();
    for (const cat of [
      "Crewnecks",
      "Hoodies",
      "Hoodies zippés",
      "T-shirts",
      "Pants",
      "Crop tops",
      "Caps",
      "Jerseys",
    ] as const) {
      const key = cat.toUpperCase().replace(/\s+/g, "");
      if (upper.replace(/\s+/g, "").includes(key.replace(/\s+/g, ""))) return cat;
    }
    return normalized;
  }
  return undefined;
}

function extractCategoryFromLines(lines: readonly string[]): ProductCategory | undefined {
  for (const line of lines) {
    const isCat = RE_CATEGORY_LINE.test(line) || RE_CATEGORY_SHORT.test(line);
    if (!isCat) continue;
    const value = RE_CATEGORY_LINE.test(line)
      ? stripLabelPrefix(line, RE_CATEGORY_LINE)
      : stripLabelPrefix(line, /\bcat\b/i);
    const cat = categoryFromLineValue(value);
    if (cat) return cat;
  }
  return undefined;
}

function detectCategoryFromKeywords(text: string): ProductCategory | undefined {
  const sample = text.slice(0, 2500);
  let best: ProductCategory | undefined;
  let bestScore = 0;
  for (const row of CATEGORY_KEYWORDS) {
    let score = 0;
    for (const re of row.patterns) {
      if (re.test(sample)) score += row.weight;
    }
    if (score > bestScore) {
      bestScore = score;
      best = row.category;
    }
  }
  return bestScore > 0 ? best : undefined;
}

export function detectCategoryFromText(raw: string): ProductCategory | undefined {
  const text = normalizePasteText(raw);
  if (!text) return undefined;
  const lines = linesFromText(text);
  const fromLines = extractCategoryFromLines(lines);
  if (fromLines) return fromLines;
  const fromKeywords = detectCategoryFromKeywords(text);
  if (fromKeywords) return fromKeywords;
  const slug = matchCatalogCategoryInText(text);
  if (slug) return productCategoryFromCatalogSlug(slug);
  return undefined;
}

function isAllCapsTitleLine(line: string): boolean {
  const t = line.trim();
  if (t.length < 4 || t.length > 96) return false;
  if (/[a-zàâäéèêëïîôùûüœ]/.test(t)) return false;
  if (!/[A-Z]/.test(t)) return false;
  return /^[A-Z0-9\s\-–—'’.,]+$/.test(t);
}

function mapColorToken(raw: string): string | undefined {
  const upper = raw.trim().toUpperCase();
  if (!upper) return undefined;
  for (const preset of ADMIN_COLOR_VARIANTS) {
    if (upper === preset.toUpperCase()) return preset;
  }
  const lut: Record<string, string> = {
    NOIR: "NOIR",
    BLACK: "NOIR",
    BLANC: "BLANC",
    WHITE: "BLANC",
    GRIS: "GRIS",
    GREY: "GRIS",
    GRAY: "GRIS",
    VERT: "VERT",
    GREEN: "VERT",
    ROUGE: "ROUGE",
    RED: "ROUGE",
    BLEU: "ROYAL BLUE",
    BLUE: "ROYAL BLUE",
  };
  return lut[upper];
}

/** Couleur dans titre / ref (`HOODIE SIGNATURE - Noir`, `… · White`). */
function extractColorFromProductTitle(raw: string): string | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const suffix = t.match(/\s*(?:[—–\-|·])\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s\-]{1,28})\s*$/);
  if (suffix?.[1]) {
    const fromSuffix = mapColorToken(suffix[1].trim());
    if (fromSuffix) return fromSuffix;
  }
  if (/\bheather\s+grey\b/i.test(t)) return "GRIS CHINÉ";
  for (const preset of ADMIN_COLOR_VARIANTS) {
    const re = new RegExp(`\\b${escapeRegExp(preset)}\\b`, "i");
    if (re.test(t)) return preset;
  }
  return undefined;
}

const RE_PURE_CATEGORY_LINE =
  /^(?:HOODIES?|HOODIE\s+ZIPP[ÉE]?S?|CREWNECKS?|T[\s\-]?SHIRTS?|TEES?|PANTS?|PANTALONS?|CARGO|CAPS?|CASQUETTES?|JERSEYS?|CROP\s*TOPS?|SWEATS?)\s*[.\-–—:|]?\s*$/i;

function isPureCategoryKeywordLine(line: string): boolean {
  return RE_PURE_CATEGORY_LINE.test(line.trim());
}

function stripTitleColorSuffix(line: string): string {
  return line
    .replace(/\s*(?:[—–\-|·])\s*(?:couleur\s*)?[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s\-]{1,28}\s*$/i, "")
    .trim();
}

/** Paragraphe libre en tête de collage (sans libellé argu/description). */
function isPreambleMarketingLine(line: string): boolean {
  const t = line.trim();
  if (t.length < 16 || t.length > 420) return false;
  if (isStructuredMetaLine(line)) return false;
  if (/^\s*\*/.test(t)) return false;
  if (isPureCategoryKeywordLine(line)) return false;
  if (isAllCapsTitleLine(line)) return false;
  if (isAllCapsTitleLine(stripTitleColorSuffix(line))) return false;
  if (RE_PERCENT.test(line) || RE_GRAMMAGE.test(line)) return false;
  if (!/[a-zàâäéèêëïîôùûüœ]/.test(t)) return false;
  return t.length >= 24 || /[.!?]/.test(t);
}

function extractLetterSizes(text: string, allowed: readonly ProductSize[]): ProductSize[] {
  const upper = text.toUpperCase();
  const found = new Set<ProductSize>();
  for (const { pattern, size } of LETTER_SIZE_SCAN) {
    if (!(allowed as readonly string[]).includes(size)) continue;
    const re = new RegExp(`(^|[^A-Z0-9])${pattern}([^A-Z0-9]|$)`, "i");
    if (re.test(upper)) found.add(size);
  }
  return SIZE_ORDER.filter((s) => found.has(s));
}

const RE_TOUR_WAIST_NUM = /(2[8-9]|3[0-9]|4[0-2])/;

/** Fautes courantes collage : tzill, t,aille → taille. */
function normalizeTourSizeTypos(text: string): string {
  return text
    .replace(/\btzill\b/gi, "taille")
    .replace(/\bt,aille\b/gi, "taille")
    .replace(/\btaille\s*[:\-.]\s*/gi, "taille ")
    .replace(/\bt\s*[:.\-]\s*(?=(?:2[8-9]|3[0-9]|4[0-2])\b)/gi, "T");
}

function pushNormalizedWaist(seen: Set<string>, raw: string): void {
  const w = normalizePantWaistSize(raw);
    if (w) seen.add(w);
}

function extractPantWaists(text: string): string[] {
  const sample = normalizeTourSizeTypos(text);
  const seen = new Set<string>();
  for (const m of sample.matchAll(/\b(2[8-9]|3[0-9]|4[0-2])\b/g)) {
    pushNormalizedWaist(seen, m[1] ?? "");
  }
  for (const m of sample.matchAll(new RegExp(`\\bT\\s*[-.]?\\s*${RE_TOUR_WAIST_NUM.source}\\b`, "gi"))) {
    pushNormalizedWaist(seen, m[1] ?? "");
  }
  for (const m of sample.matchAll(new RegExp(`\\btaille\\s+${RE_TOUR_WAIST_NUM.source}\\b`, "gi"))) {
    pushNormalizedWaist(seen, m[1] ?? "");
  }
  return Array.from(seen).sort((a, b) => Number(a) - Number(b));
}

function isTourWaistSizingLine(line: string): boolean {
  const sample = normalizeTourSizeTypos(line);
  return (
    /\bt\s*[:.\-]\s*(?:2[8-9]|3[0-9]|4[0-2])\b/i.test(line) ||
    /\bT\s*[-.]?\s*(?:2[8-9]|3[0-9]|4[0-2])\b/i.test(sample) ||
    /\btaille\s+(?:2[8-9]|3[0-9]|4[0-2])\b/i.test(sample) ||
    /\btzill\b/i.test(line) ||
    /\bt,aille\b/i.test(line)
  );
}

function normalizeStoryLine(line: string): string {
  return line
    .replace(/g\s*\/\s*m\s*\?/gi, "g/m²")
    .replace(/\bg\s*\/\s*m(?!\s*[²2?\d])/gi, "g/m²")
    .replace(/(\d+(?:[.,]\d+)?)\s*g\s*\/\s*m\s*(?:²|2)?(?!\d)/gi, (_, n: string) => `${n.replace(",", ".")} g/m²`)
    .replace(/\s+/g, " ")
    .trim();
}

/** Densité tissu : `440 g/m²`, `440g/m2`, ligne après libellé Grammage. */
function extractGrammageFromLine(line: string): string | undefined {
  const normalized = normalizeStoryLine(line);
  if (!normalized) return undefined;
  const m = normalized.match(RE_DENSITY_IN_LINE);
  if (!m?.[1]) return undefined;
  return `${m[1].replace(",", ".")} g/m²`;
}

function pushWeightLine(weightLines: string[], line: string): void {
  const token = extractGrammageFromLine(line);
  if (token) weightLines.push(token);
}

/** Prose fournisseur + `50% Coton…` collés sur une ligne (sans retour ligne). */
function peelCompositionSuffix(line: string): { prose: string; composition?: string } {
  const t = line.trim();
  const match = t.match(/^(.+?)(?<=[.!?…])\s*(\d+\s*%[\s\S]+)$/);
  if (match?.[1] && match[2] && RE_PERCENT.test(match[2])) {
    const prose = match[1].trim();
    const composition = normalizeStoryLine(match[2]);
    if (prose.length >= 8 && composition.length >= 4) {
      return { prose, composition };
    }
  }
  const glued = t.match(/^(.+?\.)(\d+\s*%.+)$/);
  if (glued?.[1] && glued[2] && RE_PERCENT.test(glued[2])) {
    return { prose: glued[1].trim(), composition: normalizeStoryLine(glued[2]) };
  }
  return { prose: t };
}

function pushDescriptionOrComposition(
  line: string,
  descriptionLines: string[],
  compositionLines: string[],
): void {
  const { prose, composition } = peelCompositionSuffix(line);
  const story = normalizeStoryLine(prose);
  if (story) descriptionLines.push(story);
  if (composition) compositionLines.push(composition);
}

function isStructuredMetaLine(line: string): boolean {
  return (
    RE_CATEGORY_LINE.test(line.trim()) ||
    RE_CATEGORY_SHORT.test(line.trim()) ||
    RE_PRICE_SOFT.test(line) ||
    RE_PRICE_LABEL.test(line) ||
    (RE_PERCENT.test(line) && !RE_STORY_LABEL.test(line)) ||
    (RE_GRAMMAGE.test(line) && !RE_STORY_LABEL.test(line)) ||
    RE_COULEUR.test(line) ||
    RE_TAILLE.test(line) ||
    RE_REF.test(line) ||
    RE_NOM.test(line) ||
    RE_TITRE.test(line) ||
    RE_STORY_LABEL.test(line)
  );
}

function pickBestTitle(candidates: string[]): string | undefined {
  const cleaned = candidates
    .map((c) => normalizeStoryLine(c))
    .filter((c) => c.length >= 2);
  if (cleaned.length === 0) return undefined;
  cleaned.sort((a, b) => b.length - a.length);
  return cleaned[0];
}

function semanticBlockForField(id: SmartParseFieldId, result: SmartProductParseOutput): MakerSemanticBlock | undefined {
  switch (id) {
    case "category":
      return result.detectedCategory
        ? { key: "category", label: "Catégorie", value: result.detectedCategory }
        : undefined;
    case "sku":
      return result.sku
        ? { key: "title", label: "SKU", value: SEMANTIC_CLIP(result.sku, 80) }
        : undefined;
    case "name":
      return result.name
        ? { key: "title", label: "Titre", value: SEMANTIC_CLIP(result.name, 120) }
        : undefined;
    case "variant":
      return result.variantColor
        ? { key: "color", label: "Couleur", value: result.variantColor }
        : undefined;
    case "sizes":
      return result.sizes?.length
        ? { key: "sizes", label: "Tailles", value: result.sizes.join(", ") }
        : undefined;
    case "price":
      return result.price
        ? { key: "price", label: "Prix", value: `${result.price} €` }
        : undefined;
    case "stock":
      return result.stock ? { key: "stock", label: "Stock", value: result.stock } : undefined;
    case "materials":
      return result.materials
        ? { key: "materials", label: "Matières", value: SEMANTIC_CLIP(result.materials, 280) }
        : undefined;
    case "fabrication":
      return result.fabrication
        ? { key: "fabrication", label: "Entretien", value: SEMANTIC_CLIP(result.fabrication, 200) }
        : undefined;
    case "description":
      return result.description
        ? { key: "description", label: "Description", value: SEMANTIC_CLIP(result.description, 320) }
        : undefined;
    default:
      return undefined;
  }
}

function buildMakerSemanticBlocks(result: SmartProductParseOutput): MakerSemanticBlock[] {
  const blocks: MakerSemanticBlock[] = [];
  for (const id of result.filled) {
    const block = semanticBlockForField(id, result);
    if (block) blocks.push(block);
  }
  return blocks;
}

export function parseSmartProductText(
  raw: string,
  fallbackCategory: ProductCategory,
): SmartProductParseOutput {
  const filled: SmartParseFieldId[] = [];
  const text = normalizePasteText(raw);
  if (!text) {
    return {
      filled: [],
      diagnostics: { blockCount: 0, footnoteLinesSkipped: 0 },
      semanticBlocks: [],
    };
  }

  const lines = linesFromText(text);
  const lineQueue = [...lines];
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  function expandInlineRoutingChunks(block: string): string[] {
    const t = block.trim();
    if (!t) return [];
    const pieces = t.split(RE_EMBEDDED_ROUTE_CHUNK);
    if (pieces.length <= 1) return [t];
    return pieces.map((p) => p.trim()).filter(Boolean);
  }

  function requeueTail(tail: string): void {
    const parts: string[] = [];
    for (const block of tail.split(/\r?\n/)) {
      parts.push(...expandInlineRoutingChunks(block));
    }
    for (let i = parts.length - 1; i >= 0; i -= 1) {
      lineQueue.unshift(parts[i] ?? "");
    }
  }

  let footnoteSkipped = 0;

  const titleCandidates: string[] = [];
  const compositionLines: string[] = [];
  const weightLines: string[] = [];
  const descriptionLines: string[] = [];

  function pushStoryFragment(fragment: string): void {
    const cleaned = normalizeStoryLine(stripCollageRoutingPrefix(fragment));
    if (cleaned) descriptionLines.push(cleaned);
  }
  const sizeScanChunks: string[] = [];
  let price: string | undefined;
  let stockQty: string | undefined;
  let sku: string | undefined;
  let variantColor: string | undefined;
  let captureDescription = false;
  let preamble = true;
  let pendingGrammage = false;
  let pendingMatiere = false;
  let captureMaterials = false;

  const detectedCategory =
    extractCategoryFromLines(lines) ?? detectCategoryFromKeywords(text);
  const category = detectedCategory ?? fallbackCategory;
  if (detectedCategory !== undefined) filled.push("category");

  while (lineQueue.length > 0) {
    const line = lineQueue.shift() ?? "";
    if (!line.trim()) continue;
    if (/^\s*\*/.test(line)) {
      footnoteSkipped += 1;
      const colorInNote = line.match(/\bCOULEUR\s+([A-ZÀ-ÿ][A-ZÀ-ÿa-z\s\-]{1,28})/i);
      if (colorInNote?.[1]) {
        const mapped = mapColorToken(colorInNote[1]);
        if (mapped) variantColor = mapped;
      }
      continue;
    }

    // 1 — Catégorie (déjà extraite ; ignorer la ligne dans la suite)
    if (RE_CATEGORY_LINE.test(line) || RE_CATEGORY_SHORT.test(line)) {
      preamble = false;
      continue;
    }
    if (isPureCategoryKeywordLine(line)) {
      preamble = false;
      continue;
    }

    const official = parseOfficialRoutingLine(line);
    if (official) {
      preamble = false;
      const { route, value } = official;
      switch (route) {
        case "sku": {
          const refValue = stripCollageRoutingPrefix(value);
          if (isLikelySkuReference(refValue)) {
            sku = normalizeSkuInput(refValue);
          } else if (refValue) {
            titleCandidates.push(normalizeStoryLine(refValue));
          }
          break;
        }
        case "story": {
          const { body, tail } = splitAtStoryStop(value);
          if (body) pushStoryFragment(body);
          captureDescription = !tail;
          if (!body && !value) captureDescription = true;
          if (tail) requeueTail(tail);
          break;
        }
        case "material": {
          const { body, tail } = splitAtMaterialStop(value);
          const normalized = normalizeStoryLine(body);
          if (normalized) compositionLines.push(normalized);
          captureMaterials = !tail && !normalized;
          if (normalized && !tail) captureMaterials = false;
          if (!normalized && !tail) captureMaterials = true;
          captureDescription = Boolean(
            tail || (!captureMaterials && materialStopCutApplied(value)),
          );
          if (tail) requeueTail(tail);
          break;
        }
        case "size":
          sizeScanChunks.push(normalizeTourSizeTypos(stripCollageRoutingPrefix(value)));
          captureDescription = false;
          break;
        case "color": {
          const { head, tail } = splitEmbeddedRoutingTail(value);
          const mapped = mapColorToken(head) ?? mapColorToken(head.split(/[,\-]/)[0] ?? "");
          if (mapped) variantColor = mapped;
          captureDescription = false;
          if (tail) requeueTail(tail);
          break;
        }
        case "grammage":
          pushWeightLine(weightLines, formatRoutedGsmValue(value));
          captureDescription = false;
          break;
        case "price": {
          const { head, tail } = splitEmbeddedRoutingTail(value);
          const priceToken = head.match(/^(\d+(?:[.,]\d+)?)\s*(?:€|EUR|e|eur)?\b/i)?.[1] ?? head;
          const p = extractEuroPrice(head) ?? formatPriceEuro(priceToken);
          if (p) price = p;
          captureDescription = false;
          if (tail) requeueTail(tail);
          break;
        }
        case "stock": {
          const { head, tail } = splitEmbeddedRoutingTail(value);
          const q = parseStockQuantity(head);
          if (q !== undefined) stockQty = q;
          captureDescription = false;
          if (tail) requeueTail(tail);
          break;
        }
        default:
          break;
      }
      continue;
    }

    if (preamble && isPreambleMarketingLine(line)) {
      pushDescriptionOrComposition(line, descriptionLines, compositionLines);
      continue;
    }

    // 2 — Titre / REF (sans `:` — ex. `ref DINGRY SIGNATURE`)
    if (RE_REF.test(line) && !/^(?:réf|ref)\s*(?:[:\-.–—])/iu.test(line.trim())) {
      preamble = false;
      const t = stripLabelPrefix(line, /\bref(?:\.|erence)?\b/i);
      if (t) titleCandidates.push(t);
      captureDescription = false;
      continue;
    }
    if (RE_NOM.test(line) && !RE_COULEUR.test(line)) {
      const t = stripLabelPrefix(line, /\b(?:nom|name)\b/i);
      if (t && !/^catégorie|categorie/i.test(t)) titleCandidates.push(t);
      captureDescription = false;
      continue;
    }
    if (RE_TITRE.test(line)) {
      const t = stripLabelPrefix(line, RE_TITRE);
      if (t) titleCandidates.push(t);
      captureDescription = false;
      continue;
    }
    if (isPureCategoryKeywordLine(line)) {
      preamble = false;
      captureDescription = false;
      continue;
    }

    if (captureMaterials) {
      const { body, tail } = splitAtMaterialStop(line);
      const normalized = normalizeStoryLine(body);
      if (normalized) compositionLines.push(normalized);
      captureMaterials = Boolean(tail);
      if (!tail && materialStopCutApplied(line)) captureDescription = true;
      if (tail) requeueTail(tail);
      continue;
    }

    if (pendingMatiere) {
      pendingMatiere = false;
      const { body, tail } = splitAtMaterialStop(line);
      const normalized = normalizeStoryLine(body);
      if (normalized) compositionLines.push(normalized);
      captureDescription = false;
      if (tail) requeueTail(tail);
      continue;
    }

    if (RE_MATIERE_LABEL.test(line.trim())) {
      pendingMatiere = true;
      captureDescription = false;
      continue;
    }

    if (pendingGrammage) {
      pendingGrammage = false;
      pushWeightLine(weightLines, line);
      captureDescription = false;
      continue;
    }

    if (RE_GRAMMAGE_LABEL.test(line.trim())) {
      pendingGrammage = true;
      captureDescription = false;
      continue;
    }

    const titleBody = stripTitleColorSuffix(line);
    if (isAllCapsTitleLine(titleBody) || isAllCapsTitleLine(line)) {
      const colorInline = extractColorFromProductTitle(line);
      if (colorInline) variantColor = colorInline;
      titleCandidates.push(titleBody.length >= 4 ? titleBody : line.trim());
      captureDescription = false;
      preamble = false;
      continue;
    }

    // 3 — Prix
    const priceEuro = line.match(RE_PRICE_SOFT);
    if (priceEuro?.[1]) {
      const v = formatPriceEuro(priceEuro[1]);
      if (v) price = v;
      captureDescription = false;
      continue;
    }
    const priceLabel = line.match(RE_PRICE_LABEL);
    if (priceLabel?.[1]) {
      const v = formatPriceEuro(priceLabel[1]);
      if (v) price = v;
      captureDescription = false;
      continue;
    }
    const stockLabel = line.match(RE_STOCK_LABEL);
    if (stockLabel?.[1]) {
      const q = parseStockQuantity(stockLabel[1]);
      if (q !== undefined) stockQty = q;
      captureDescription = false;
      continue;
    }

    // Couleur (fiche structurée)
    if (RE_COULEUR.test(line)) {
      const body = stripLabelPrefix(line, RE_COULEUR);
      const mapped = mapColorToken(body) ?? mapColorToken(body.split(/[,\-]/)[0] ?? "");
      if (mapped) variantColor = mapped;
      captureDescription = false;
      continue;
    }

    // Tailles (libellé ou tour T40 / Taille 40 / tzill / size:)
    if (RE_SIZE_LABEL.test(line) || RE_TAILLE.test(line) || isTourWaistSizingLine(line)) {
      const body = RE_SIZE_LABEL.test(line)
        ? stripLabelPrefix(line, /^(?:tailles?|size|tzill)/iu)
        : RE_TAILLE.test(line)
          ? stripLabelPrefix(line, RE_TAILLE)
          : stripCollageRoutingPrefix(line.trim());
      if (body) sizeScanChunks.push(normalizeTourSizeTypos(body));
      captureDescription = false;
      continue;
    }

    // 4 — Matière (%)
    if (RE_PERCENT.test(line)) {
      const { body, tail } = splitAtMaterialStop(line);
      const normalized = normalizeStoryLine(body);
      if (normalized) compositionLines.push(normalized);
      const density = normalized.match(/\d+(?:[.,]\d+)?\s*g\/m²/i);
      if (density?.[0]) weightLines.push(density[0].replace(/\s+/g, " "));
      captureDescription = false;
      if (tail) requeueTail(tail);
      continue;
    }

    // 5 — Grammage
    if (RE_GRAMMAGE.test(line)) {
      const g = normalizeStoryLine(line);
      if (!/^grammage\s*$/i.test(g)) pushWeightLine(weightLines, g);
      captureDescription = false;
      continue;
    }

    const densityOnly = extractGrammageFromLine(line);
    if (densityOnly && !RE_PERCENT.test(line)) {
      pushWeightLine(weightLines, line);
      captureDescription = false;
      continue;
    }

    // 6 — Arguments / description (argu, zrgi, story, typos)
    if (RE_STORY_LABEL.test(line)) {
      const rest = stripLabelPrefix(line, RE_STORY_LABEL);
      const { body, tail } = splitAtStoryStop(rest);
      if (body) pushStoryFragment(body);
      captureDescription = !tail;
      if (tail) requeueTail(tail);
      continue;
    }

    if (captureDescription && !isStructuredMetaLine(line)) {
      const { body, tail } = splitAtStoryStop(line);
      if (body) pushDescriptionOrComposition(body, descriptionLines, compositionLines);
      captureDescription = !tail;
      if (tail) requeueTail(tail);
      continue;
    }

    captureDescription = false;
    preamble = false;
  }

  const name = pickBestTitle(titleCandidates);
  if (sku) filled.push("sku");
  if (name) filled.push("name");
  if (price !== undefined) filled.push("price");
  if (stockQty !== undefined) filled.push("stock");

  if (!variantColor) {
    const titleColor =
      (name && extractColorFromProductTitle(name)) ||
      titleCandidates.map(extractColorFromProductTitle).find(Boolean);
    if (titleColor) variantColor = titleColor;
  }
  if (variantColor !== undefined) filled.push("variant");

  const pants = isPantsCategory(category);
  const allowed = ADMIN_CATEGORY_SIZES[category];
  const sizeSource =
    sizeScanChunks.length > 0
      ? sizeScanChunks.join("\n")
      : lines.filter((l) => /\btailles?\s+disponibles\b/i.test(l)).join("\n") || text;
  const sizes = pants
    ? (extractPantWaists(sizeSource) as ProductSize[])
  : extractLetterSizes(sizeSource, allowed);
  if (sizes.length > 0) filled.push("sizes");

  let materials: string | undefined;
  if (compositionLines.length > 0) {
    materials = trimStoryField(Array.from(new Set(compositionLines)).join("\n"));
    if (materials.length > 0) filled.push("materials");
    else materials = undefined;
  }

  let weight: string | undefined;
  if (weightLines.length > 0) {
    let uniq = Array.from(new Set(weightLines)).filter((l) => !/^grammage\s*$/i.test(l));
    const withDensity = uniq.filter((l) => /g\/m²|gsm/i.test(l));
    if (withDensity.length > 0) {
      uniq = withDensity;
    }
    weight = trimStoryField(uniq.join("\n"));
    if (weight.length > 0) {
      filled.push("materials");
    } else weight = undefined;
  }

  let fabrication: string | undefined;
  let description: string | undefined;
  const descFiltered = descriptionLines.filter((l) => !name || l !== name);
  if (descFiltered.length > 0) {
    const care = descFiltered.filter((l) => RE_CARE_LINE.test(l));
    const sales = descFiltered.filter((l) => !RE_CARE_LINE.test(l));
    if (sales.length > 0) {
      description = trimStoryField(sales.join("\n\n"));
    if (description.length > 0) filled.push("description");
    else description = undefined;
    }
    if (care.length > 0) {
      fabrication = trimStoryField(care.join("\n\n"));
      if (fabrication.length > 0) filled.push("fabrication");
      else fabrication = undefined;
    }
    if (!description && care.length === 0 && descFiltered.length > 0) {
      description = trimStoryField(descFiltered.join("\n\n"));
      if (description.length > 0) filled.push("description");
    }
  }

  const result: SmartProductParseOutput = {
    filled,
    diagnostics: { blockCount: blocks.length || 1, footnoteLinesSkipped: footnoteSkipped },
    semanticBlocks: [],
    detectedCategory: detectedCategory ?? undefined,
    sku,
    name,
    description,
    materials,
    weight,
    fabrication,
    price,
    stock: stockQty,
    sizes: sizes.length > 0 ? sizes : undefined,
    variantColor,
  };

  result.semanticBlocks = buildMakerSemanticBlocks(result);
  return result;
}

export function buildSmartParseRecap(result: SmartProductParseOutput): string {
  if (result.filled.length === 0) {
    return "Smart collage · aucun champ détecté. Utilise cat/ref/titre, prix, %, g/m, argu…";
  }
  const lines: string[] = ["Smart collage · détection :"];
  const blocks = result.semanticBlocks.length > 0 ? result.semanticBlocks : buildMakerSemanticBlocks(result);
  for (const b of blocks) {
    lines.push(`• ${b.label} : ${b.value}`);
  }
  lines.push(
    `• Analyse : ${result.diagnostics.blockCount} bloc(s), ${result.diagnostics.footnoteLinesSkipped} ligne(s) * ignorée(s).`,
  );
  return lines.join("\n");
}

export function summarizeSmartParseFilled(filled: readonly SmartParseFieldId[]): string {
  if (filled.length === 0) return "Smart collage · aucun champ détecté — ajuste le texte ou la catégorie.";
  const labels = filled.map((id) => SMART_PARSE_FIELD_LABELS[id]);
  return `Smart collage · champs remplis : ${labels.join(" · ")}.`;
}
