import { trimStoryField } from "@/lib/admin/product-story";
import { normalizePantWaistSize } from "@/lib/admin/pant-waist";
import { ADMIN_COLOR_VARIANTS, isPantsCategory } from "@/lib/admin/product-variant-presets";
import {
  ADMIN_CATEGORY_SIZES,
  PRODUCT_PRINT_PLACEMENT_LABELS,
  type ProductCategory,
  type ProductPrintPlacement,
  type ProductSize,
} from "@/lib/admin/types";

export type SmartParseFieldId =
  | "category"
  | "name"
  | "description"
  | "materials"
  | "fabrication"
  | "limitedEdition"
  | "price"
  | "sizes"
  | "variant"
  | "printPlacement";

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
  printPlacement: "Impression",
};

export type SmartProductParseResult = {
  detectedCategory?: ProductCategory;
  name?: string;
  description?: string;
  materials?: string;
  fabrication?: string;
  limitedEdition?: string;
  price?: string;
  sizes?: ProductSize[];
  variantColor?: string;
  printPlacement?: ProductPrintPlacement;
  filled: SmartParseFieldId[];
};

export type SmartParseDiagnostics = {
  blockCount: number;
  footnoteLinesSkipped: number;
};

/** Un « slot » Maker pour récap UI — l’ordre suit celui de `filled` (détection). */
export type MakerSemanticBlock = {
  key:
    | "category"
    | "title"
    | "color"
    | "sizes"
    | "price"
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
  /** Blocs sémantiques remplis (récap détaillé modale). */
  semanticBlocks: MakerSemanticBlock[];
};

const RE_PRICE =
  /(?:^|[\s:()·|])(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|EUR|euros?)(?=[\s.,;:!?)·|]|$)/i;
const RE_MATERIAL_SIGNAL =
  /%|g\/m²|g\/m2|g\/m\?|gsm|grammage|mg\/m²|mg\/m2|\b(coton|polyester|polyamide|laine|viscose|élasthanne|elasthanne|lin|soie|nylon|acrylique|fleece|molleton)\b/i;
const RE_FABRICATION_LINE =
  /fabriqué|made\s+in|confectionn|importé|produit\s+en|manufacturé|cousu/i;
const RE_LIMITED_LINE =
  /édition\s+limitée|limited\s+edition|numérotée|série\s+limitée|exemplaires?\s+limit/i;
/** Ligne qui n’est qu’un prix affiché (ne doit pas alimenter la description). */
const RE_LINE_PRICE_ONLY =
  /^\s*(?:€|EUR|\$)?\s*\d{1,4}(?:[.,]\d{1,2})?\s*(?:€|EUR|euros?)?\s*$/i;
/** Suffixe titre du type « — couleur noir » ou « · 75 € » (hors corps marketing). */
const RE_TITLE_COLOR_SUFFIX = /\s*[—–\-|·]\s*(?:couleur|color|colour|coloris)\s*[:\-]?\s*.+$/i;
const RE_TITLE_PRICE_SUFFIX = /\s*[—–\-|·]\s*[^—–\-|·]{0,52}\d{1,4}(?:[.,]\d{1,2})?\s*(?:€|EUR)\s*$/i;
const RE_SECTION_LABEL =
  /^\s*(matière|matériaux|composition|grammage|densité|tailles?|sizes?|couleur|coloris|colour|prix|price|fabriqué|origine)\s*[:\-.]?\s*/i;

const RE_PRINT_RECTO_VERSO =
  /\b(?:impression\s+)?(?:recto\s*[/·\-–—]\s*verso|recto\s*\+\s*verso|recto\s+et\s+verso|recto[\s,/]+verso)\b/i;
const RE_PRINT_RECTO_ONLY =
  /\b(?:impression\s+)?(?:recto\s+seul|face\s+avant\s+seul|print\s+recto\s+only)\b/i;
const RE_PRINT_VERSO_ONLY =
  /\b(?:impression\s+)?(?:verso\s+seul|dos\s+seul|print\s+verso\s+only)\b/i;

function detectPrintPlacementFromText(sample: string): ProductPrintPlacement | undefined {
  const t = sample.replace(/\u00a0/g, " ");
  if (RE_PRINT_RECTO_ONLY.test(t)) return "RECTO_ONLY";
  if (RE_PRINT_VERSO_ONLY.test(t)) return "VERSO_ONLY";
  if (RE_PRINT_RECTO_VERSO.test(t)) return "RECTO_VERSO";
  return undefined;
}

/** Ligne dédiée finition (évite doublon dans la description). */
function lineLooksLikePrintPlacementOnly(line: string): boolean {
  const t = line.trim();
  if (t.length === 0 || t.length > 120) return false;
  if (!/\b(recto|verso)\b/i.test(t)) return false;
  return detectPrintPlacementFromText(t) !== undefined;
}

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

type CategoryLexicon = { category: ProductCategory; patterns: RegExp[]; weight: number };

const CATEGORY_LEXICON: CategoryLexicon[] = [
  {
    category: "Hoodies zippés",
    weight: 3,
    patterns: [/\bhoodie\s*zipp/i, /\bzipp[\sée]*hoodie/i, /\bsweat\s*zip/i, /\bpull\s*zip/i],
  },
  {
    category: "Hoodies",
    weight: 2,
    patterns: [/\bhoodies?\b/i, /\bhoodis\b/i, /\bsweat\s*shirt\b/i, /\bpull\s*capuche\b/i, /\bsweat\s*capuche\b/i],
  },
  {
    category: "T-shirts",
    weight: 2,
    patterns: [/\bt[\s\-]?shirts?\b/i, /\btshirts?\b/i, /\btee[\s\-]?shirts?\b/i, /\btee\b/i],
  },
  {
    category: "Pants",
    weight: 2,
    patterns: [/\bpants?\b/i, /\bpantalons?\b/i, /\bcargo\b/i, /\bchinos?\b/i, /\bjoggers?\b/i, /\bjeans?\b/i],
  },
  {
    category: "Caps",
    weight: 2,
    patterns: [/\bcaps?\b/i, /\bcasquettes?\b/i, /\bsnapback\b/i, /\btrucker\b/i],
  },
  {
    category: "Crewnecks",
    weight: 1,
    patterns: [/\bcrew\s*necks?\b/i, /\bcrewneck\b/i, /\bsweat\s*col\s*rond\b/i],
  },
  {
    category: "Jerseys",
    weight: 1,
    patterns: [/\bjerseys?\b/i, /\bmaillots?\b/i],
  },
  {
    category: "Crop tops",
    /** Doit battre Pants quand le texte dit « cargo » (poche / style) sans être un pantalon. */
    weight: 4,
    patterns: [/\bcrop\s*tops?\b/i],
  },
];

const PURE_CATEGORY_LINE =
  /^(HOODIES?|HOODIE\s*ZIPP[ÉE]?S?|T[\s\-]?SHIRTS?|TEES?|PANTS?|PANTALONS?|CARGO|CAPS?|CASQUETTES?|JERSEYS?|CREW(?:\s*NECKS?)?|SWEATS?|CREWNECKS?)\s*[.\-–—:|]?\s*$/i;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizePasteText(raw: string): string {
  let t = raw.replace(/\u00a0/g, " ").replace(/\r\n/g, "\n");
  t = t.normalize("NFKC");
  t = t.replace(/g\s*\/\s*m\s*\?/gi, "g/m²");
  t = t.replace(/g\s*\/\s*m\s*2\b/gi, "g/m²");
  t = t.replace(/m\?²/gi, "m²");
  t = t.replace(/\bm2\b/gi, "m²");
  t = t.replace(/[^\S\r\n]+/g, " ");
  return t.trim();
}

function linesFromText(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function isFootnoteLine(line: string): boolean {
  return /^\s*\*/.test(line);
}

function stripFootnoteLines(text: string): { body: string; skipped: number } {
  const lines = text.split(/\n/);
  let skipped = 0;
  const kept: string[] = [];
  for (const line of lines) {
    if (isFootnoteLine(line)) {
      skipped += 1;
      continue;
    }
    kept.push(line);
  }
  return { body: kept.join("\n"), skipped };
}

function scoreCategories(textSample: string): ProductCategory | undefined {
  const upper = textSample.toUpperCase();
  let best: ProductCategory | undefined;
  let bestScore = 0;
  for (const { category, patterns, weight } of CATEGORY_LEXICON) {
    let s = 0;
    for (const re of patterns) {
      if (re.test(upper)) s += weight;
    }
    if (s > bestScore) {
      bestScore = s;
      best = category;
    }
  }
  return bestScore > 0 ? best : undefined;
}

export function detectCategoryFromText(raw: string): ProductCategory | undefined {
  const normalized = normalizePasteText(raw);
  if (!normalized) return undefined;
  const head = `${linesFromText(normalized)[0] ?? ""}\n${normalized.slice(0, 800)}`;
  return scoreCategories(head);
}

function isPureCategoryLine(line: string): boolean {
  return PURE_CATEGORY_LINE.test(line.trim());
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

function extractBestPrice(text: string): string | undefined {
  for (const m of text.matchAll(new RegExp(RE_PRICE.source, "gi"))) {
    const g = m[1];
    if (g) {
      const v = formatPriceEuro(g);
      if (v !== undefined) return v;
    }
  }
  return undefined;
}

const COLOR_RULES: readonly { re: RegExp; variant: string; score: number }[] = [
  { re: /\bheather\s+grey\b/i, variant: "GRIS CHINÉ", score: 50 },
  { re: /\bgris\s+chiné\b/i, variant: "GRIS CHINÉ", score: 48 },
  { re: /\bgris\s+chine\b/i, variant: "GRIS CHINÉ", score: 48 },
  { re: /\broyal\s+blue\b/i, variant: "ROYAL BLUE", score: 45 },
  { re: /\bbleu\s+roi\b/i, variant: "BLEU ROI", score: 45 },
  { re: /\bking\s+blue\b/i, variant: "KING BLUE", score: 45 },
  { re: /\bjaune\s+fluo\b/i, variant: "JAUNE FLUO", score: 45 },
  { re: /\bnoir\b/i, variant: "NOIR", score: 20 },
  { re: /\bblack\b/i, variant: "BLACK", score: 20 },
  { re: /\bblanc\b/i, variant: "BLANC", score: 20 },
  { re: /\bwhite\b/i, variant: "WHITE", score: 20 },
  { re: /\bvert\b/i, variant: "VERT", score: 18 },
  { re: /\brouge\b/i, variant: "ROUGE", score: 18 },
  { re: /\bgris\b/i, variant: "GRIS", score: 15 },
  { re: /\brose\b/i, variant: "PINK", score: 18 },
  { re: /\bviolet\b/i, variant: "PURPLE", score: 18 },
  { re: /\bchocolat\b/i, variant: "CHOCOLAT", score: 20 },
  { re: /\bzenith\b/i, variant: "ZENITH", score: 22 },
];

function mapColorToken(raw: string): string | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const upper = t.toUpperCase();
  for (const preset of ADMIN_COLOR_VARIANTS) {
    if (upper === preset.toUpperCase()) return preset;
  }
  const lut: Record<string, string> = {
    NOIR: "NOIR",
    BLACK: "BLACK",
    BLANC: "BLANC",
    WHITE: "WHITE",
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

function extractVariantColor(fullText: string): string | undefined {
  let best: { variant: string; score: number } | undefined;
  const bump = (variant: string | undefined, score: number) => {
    if (!variant) return;
    if (!best || score > best.score) best = { variant, score };
  };

  for (const row of COLOR_RULES) {
    if (row.re.test(fullText)) bump(row.variant, row.score);
  }

  for (const m of fullText.matchAll(/\bcouleur\s*[:\-]?\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s\-]{1,36})/gi)) {
    bump(mapColorToken(m[1] ?? ""), 42);
  }
  for (const m of fullText.matchAll(/\*+\s*COULEUR\s+([A-Z0-9][A-Z0-9\s\-]{1,24})/gi)) {
    bump(mapColorToken(m[1] ?? ""), 55);
  }
  /** Notes type `*4XL-5XL COULEUR NOIR` — la ligne est exclue des tailles mais la couleur compte. */
  for (const m of fullText.matchAll(/\*[^\n]*\bCOULEUR\s+([A-ZÀ-ÿ][A-ZÀ-ÿa-z\s\-]{1,28})/gi)) {
    bump(mapColorToken(m[1] ?? ""), 58);
  }

  const scan = fullText.slice(0, 2500);
  for (const preset of ADMIN_COLOR_VARIANTS) {
    const re = new RegExp(`\\b${escapeRegExp(preset)}\\b`, "i");
    if (re.test(scan)) bump(preset, 28 + Math.min(12, preset.length));
  }

  return best?.variant;
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

function sortSizes(found: Iterable<ProductSize>): ProductSize[] {
  const idx = new Map<ProductSize, number>();
  SIZE_ORDER.forEach((s, i) => idx.set(s, i));
  return [...new Set(found)].sort((a, b) => (idx.get(a) ?? 99) - (idx.get(b) ?? 99));
}

/**
 * Tailles valides uniquement ; chiffres EU (grille XS→40 …) ignorés pour ne pas parasiter le scan lettres.
 */
function extractLetterSizes(textNoFootnotes: string, allowed: readonly ProductSize[]): ProductSize[] {
  let scan = textNoFootnotes;
  scan = scan.replace(/\b(?:EU|US|UK)\b\s*[:.]?\s*[\d\s,/–-]{6,}/gi, " ");
  /** Mensurations EU isolées (40–56), ex. tableau « XS 40 … 5XL* 54 ». */
  scan = scan.replace(
    /(?:^|[\s,;·|])(?:4[0-9]|5[0-6])\b(?=[\s,;·|*)\]]|$)/gi,
    " ",
  );
  /** `4XL*` / `5XL*` en fin de cellule tableau. */
  scan = scan.replace(
    /\b(XXS|XS|[SML]|XL|2XL|3XL|4XL|5XL)\*(?=\s|$|[,;·|)])/gi,
    "$1",
  );

  const found = new Set<ProductSize>();
  for (const { pattern, size } of LETTER_SIZE_SCAN) {
    if (!allowed.includes(size)) continue;
    const re = new RegExp(`\\b${escapeRegExp(pattern)}\\b`, "i");
    if (re.test(scan)) found.add(size);
  }
  return sortSizes(found);
}

function extractPantWaists(textNoFootnotes: string): ProductSize[] {
  const seen = new Set<ProductSize>();
  const lines = linesFromText(textNoFootnotes);
  const body =
    lines
      .filter((line) => {
        const nums = line.match(/\b\d{2}\b/g) ?? [];
        if (nums.length >= 5) return false;
        return true;
      })
      .join("\n") || textNoFootnotes;

  for (const m of body.matchAll(/\b(2[8-9]|3[0-9]|4[0-2])\b/g)) {
    const w = normalizePantWaistSize(m[1] ?? "");
    if (w) seen.add(w);
  }
  return Array.from(seen).sort((a, b) => Number(a) - Number(b));
}

type TaggedSection = {
  kind: "material" | "size" | "price" | "color" | "fabrication" | "other";
  body: string;
};

function tagSections(lines: readonly string[]): TaggedSection[] {
  const out: TaggedSection[] = [];
  let buffer: string[] = [];
  function flush() {
    if (buffer.length) {
      out.push({ kind: "other", body: buffer.join("\n") });
      buffer = [];
    }
  }
  for (const line of lines) {
    const m = line.match(RE_SECTION_LABEL);
    if (m) {
      flush();
      const rest = line.replace(RE_SECTION_LABEL, "").trim();
      const label = m[1]?.toLowerCase() ?? "";
      let kind: TaggedSection["kind"] = "other";
      if (/matière|matériaux|composition|grammage|densité/.test(label)) kind = "material";
      else if (/taille|size/.test(label)) kind = "size";
      else if (/prix|price/.test(label)) kind = "price";
      else if (/couleur|coloris|colour/.test(label)) kind = "color";
      else if (/fabriqué|origine/.test(label)) kind = "fabrication";
      out.push({ kind, body: rest });
    } else {
      buffer.push(line);
    }
  }
  flush();
  return out;
}

function looksLikeMaterialLine(line: string): boolean {
  return RE_MATERIAL_SIGNAL.test(line);
}

function normalizeStoryBody(s: string): string {
  return s
    .replace(/g\s*\/\s*m\s*\?/gi, "g/m²")
    .replace(/g\s*\/\s*m\s*2\b/gi, "g/m²")
    .replace(/\s+/g, " ")
    .trim();
}

/** Retire du libellé produit les mentions couleur / prix (réservées aux champs dédiés). */
function stripTitleMarketingSuffix(raw: string): string {
  let s = raw.trim();
  s = s.replace(RE_TITLE_COLOR_SUFFIX, "").trim();
  s = s.replace(RE_TITLE_PRICE_SUFFIX, "").trim();
  return s;
}

/** Compare titre / ligne pour éviter de recopier le nom dans la description (espaces, tirets, ·). */
function normalizeForTitleDedup(s: string): string {
  return s
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[\s\-–—·|:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function lineDuplicatesProductName(line: string, name: string): boolean {
  const a = normalizeForTitleDedup(line);
  const b = normalizeForTitleDedup(name);
  if (a.length < 2 || b.length < 2) return false;
  return a === b;
}

/** Codes taille lettre (scan parseur) — ordre longueur décroissante pour regex. */
const LETTER_SIZE_PATTERN_SRC = "5XL|4XL|XXXL|3XL|XXL|2XL|XL|XS|XXS|TU|(?<![A-Z0-9])[SML](?![A-Z0-9])";

/**
 * S 46, M 48/50, XL 48 · 50 — réservé gestion stock.
 * Les codes multi-lettres peuvent avoir des mensurations optionnelles ;
 * pour S/M/L seul, il faut un chiffre EU (évite d’effacer le « m » de `g/m²`).
 */
const RE_LETTER_PLUS_MENSURATION_MULTI = new RegExp(
  `\\b(?:5XL|4XL|XXXL|3XL|XXL|2XL|XL|XS|XXS|TU)\\s*\\*?\\s*(?:\\d{2}(?:\\s*[/·\\-–]\\s*\\d{2})?)?`,
  "gi",
);
const RE_LETTER_PLUS_MENSURATION_SML = new RegExp(
  "\\b[SML]\\s*\\*?\\s*\\d{2}(?:\\s*[/·\\-–]\\s*\\d{2})?",
  "gi",
);

/** Fourchettes type 48/50, 50–52 (mensurations EU courantes grille). */
const RE_EU_MENSURATION_RANGE = /\b(?:4[0-9]|5[0-6])\s*[/·\-–]\s*(?:4[0-9]|5[0-6])\b/gi;

/**
 * Retire d’un champ « public » les morceaux qui ressemblent à une grille tailles / mensurations.
 */
function stripPublicSizeFragments(raw: string): string {
  const gpmPlaceholders: string[] = [];
  let s = raw.replace(/\bg\s*\/\s*m[²2\u00B2]?/gi, (m) => {
    const id = gpmPlaceholders.length;
    gpmPlaceholders.push(m);
    return `\uE000GPM${id}\uE000`;
  });
  for (let pass = 0; pass < 4; pass++) {
    const next = s
      .replace(RE_LETTER_PLUS_MENSURATION_MULTI, " ")
      .replace(RE_LETTER_PLUS_MENSURATION_SML, " ")
      .replace(RE_EU_MENSURATION_RANGE, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (next === s) break;
    s = next;
  }
  return s.replace(/\uE000GPM(\d+)\uE000/g, (_, d) => gpmPlaceholders[Number(d)] ?? "");
}

function tokenizeSizeGridProbe(line: string): string[] {
  return line
    .split(/[\s,;|·]+/)
    .map((t) => t.replace(/^\*+|\*+$/g, "").trim())
    .filter(Boolean);
}

/** Ligne essentiellement une inventaire tailles / chiffres (pas du wording client). */
function lineLooksLikeSizeGridOnly(line: string): boolean {
  const t = line.trim();
  if (t.length < 3) return false;
  /** Libellés explicites — jamais dans la copy publique. */
  if (/^\s*(tailles?|sizes?)\s*[:\-]/i.test(t) && t.length < 160) return true;

  const tokens = tokenizeSizeGridProbe(t);
  if (tokens.length < 2) return false;

  let sizeLike = 0;
  for (const tok of tokens) {
    if (/^(?:5XL|4XL|XXXL|3XL|XXL|2XL|XL|XS|XXS|TU|[SML])$/i.test(tok)) {
      sizeLike += 1;
      continue;
    }
    if (/^(?:4[0-9]|5[0-6])$/i.test(tok)) {
      sizeLike += 1;
      continue;
    }
    if (/^(?:4[0-9]|5[0-6])[/·\-–](?:4[0-9]|5[0-6])$/i.test(tok)) {
      sizeLike += 1;
    }
  }
  const ratio = sizeLike / tokens.length;
  if (tokens.length >= 2 && ratio >= 0.85) return true;
  if (tokens.length >= 4 && ratio >= 0.65) return true;
  /** Beaucoup de codes courts sans phrase (pas de voyelle longue). */
  if (tokens.length >= 5 && !/[.!?]/.test(t) && sizeLike >= 4) return true;
  return false;
}

const SEMANTIC_CLIP = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, max)}…`);

function semanticBlockForField(
  id: SmartParseFieldId,
  result: SmartProductParseResult,
): MakerSemanticBlock | undefined {
  switch (id) {
    case "category":
      return result.detectedCategory !== undefined
        ? { key: "category", label: "Catégorie", value: result.detectedCategory }
        : undefined;
    case "name":
      return result.name !== undefined
        ? { key: "title", label: "Titre", value: SEMANTIC_CLIP(result.name, 200) }
        : undefined;
    case "variant":
      return result.variantColor !== undefined
        ? { key: "color", label: "Couleur", value: result.variantColor }
        : undefined;
    case "sizes":
      return result.sizes !== undefined && result.sizes.length > 0
        ? { key: "sizes", label: "Tailles", value: result.sizes.join(", ") }
        : undefined;
    case "price":
      return result.price !== undefined
        ? { key: "price", label: "Prix", value: `${result.price} €` }
        : undefined;
    case "materials":
      return result.materials !== undefined
        ? {
            key: "materials",
            label: "Matières",
            value: SEMANTIC_CLIP(result.materials, 280),
          }
        : undefined;
    case "fabrication":
      return result.fabrication !== undefined
        ? {
            key: "fabrication",
            label: "Fabrication",
            value: SEMANTIC_CLIP(result.fabrication, 200),
          }
        : undefined;
    case "limitedEdition":
      return result.limitedEdition !== undefined
        ? {
            key: "limitedEdition",
            label: "Édition limitée",
            value: SEMANTIC_CLIP(result.limitedEdition, 200),
          }
        : undefined;
    case "description":
      return result.description !== undefined
        ? {
            key: "description",
            label: "Description",
            value: SEMANTIC_CLIP(result.description, 320),
          }
        : undefined;
    case "printPlacement":
      return result.printPlacement !== undefined
        ? {
            key: "printPlacement",
            label: "Impression",
            value: PRODUCT_PRINT_PLACEMENT_LABELS[result.printPlacement],
          }
        : undefined;
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

/** Ordre = ordre des entrées dans `filled` (détection), pas un ordre canonique fixe. */
function buildMakerSemanticBlocks(result: SmartProductParseOutput): MakerSemanticBlock[] {
  const blocks: MakerSemanticBlock[] = [];
  for (const id of result.filled) {
    const block = semanticBlockForField(id, result);
    if (block !== undefined) blocks.push(block);
  }
  return blocks;
}

function extractNameFromLines(
  lines: readonly string[],
  detectedCategory: ProductCategory | undefined,
): { name: string; titleLineIndex: number } | undefined {
  if (lines.length === 0) return undefined;
  let idx = 0;
  if (isPureCategoryLine(lines[0] ?? "")) idx = 1;
  if (idx >= lines.length) idx = 0;

  const candidates: { line: string; i: number }[] = [];
  for (let i = idx; i < Math.min(lines.length, idx + 5); i++) {
    const line = lines[i];
    if (!line) continue;
    if (isFootnoteLine(line)) continue;
    if (lineLooksLikeSizeGridOnly(line)) continue;
    if (/^(prix|price|tailles?|sizes?|matière|matériaux)\s*[:\-]/i.test(line)) continue;
    if (looksLikeMaterialLine(line) && /%/.test(line)) continue;
    if (line.length >= 3 && line.length <= 140) candidates.push({ line, i });
  }

  const scored = candidates
    .map(({ line, i }) => {
      let score = 0;
      const u = line.toUpperCase();
      if (/\bDINGRY\b/.test(u)) score += 8;
      if (/SIGNATURE|ORIGINAL|COLLECTION|ÉDITION|EDITION/.test(u)) score += 4;
      if (/^[A-Z0-9\s\-–—'«».,]+$/u.test(line) && line.length <= 72) score += 3;
      if (line.length >= 12 && line.length <= 90) score += 2;
      /** Phrase marketing (souvent la description), pas le libellé produit. */
      if (/[.!?]\s*$/.test(line.trim()) && line.length >= 28) score -= 10;
      if (line.split(/\s+/).length >= 12) score -= 4;
      if (detectedCategory) {
        const catFrag = detectedCategory.toUpperCase().replace(/\s+/g, "").slice(0, 7);
        if (catFrag && u.replace(/\s/g, "").includes(catFrag)) score -= 3;
      }
      return { line: normalizeStoryBody(line), score, i };
    })
    .sort((a, b) => b.score - a.score);

  const top = scored[0];
  if (!top || top.score < 0) return undefined;
  let name = stripTitleMarketingSuffix(top.line);
  name = stripPublicSizeFragments(name);
  if (name.length < 2) return undefined;
  return { name, titleLineIndex: top.i };
}

function looksLikeLimitedLine(line: string): boolean {
  return RE_LIMITED_LINE.test(line);
}

/** Ligne déjà couverte par prix / couleur / notes * — ne pas dupliquer dans la description. */
function isLineExcludedFromDescription(line: string): boolean {
  const t = line.trim();
  if (t.length === 0) return true;
  if (isFootnoteLine(t)) return true;
  if (RE_LINE_PRICE_ONLY.test(t)) return true;
  if (t.length < 72 && /^\s*couleur\s*[:\-]/i.test(t)) return true;
  if (t.length < 55 && RE_PRICE.test(t) && !RE_MATERIAL_SIGNAL.test(t)) return true;
  return false;
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

  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const { body: textNoStarLines, skipped: footnoteSkipped } = stripFootnoteLines(text);
  const lines = linesFromText(text);
  const tagged = tagSections(lines);

  const printPlacementFromPaste = detectPrintPlacementFromText(text);
  if (printPlacementFromPaste !== undefined) filled.push("printPlacement");

  const detectedCategory = detectCategoryFromText(text);
  const category = detectedCategory ?? fallbackCategory;
  if (detectedCategory !== undefined) filled.push("category");

  const allowedSizes = ADMIN_CATEGORY_SIZES[category];
  const pants = isPantsCategory(category);

  const priceFromTags = tagged
    .filter((s) => s.kind === "price")
    .map((s) => s.body)
    .join("\n");
  const price = extractBestPrice(`${priceFromTags}\n${text}`);
  if (price !== undefined) filled.push("price");

  const sizeSet = new Set<ProductSize>();
  if (pants) {
    for (const w of extractPantWaists(textNoStarLines)) sizeSet.add(w);
  } else {
    for (const sz of extractLetterSizes(textNoStarLines, allowedSizes)) sizeSet.add(sz);
    for (const sec of tagged) {
      if (sec.kind !== "size" || !sec.body) continue;
      for (const sz of extractLetterSizes(sec.body, allowedSizes)) sizeSet.add(sz);
    }
  }
  const sizes = sortSizes(sizeSet);
  if (sizes.length > 0) filled.push("sizes");

  let variantColor: string | undefined;
  if (!pants) {
    variantColor = extractVariantColor(text);
    for (const sec of tagged) {
      if (sec.kind !== "color" || !sec.body.trim()) continue;
      const fromLabel = mapColorToken(sec.body) ?? extractVariantColor(sec.body);
      if (fromLabel) variantColor = fromLabel;
    }
    if (variantColor !== undefined) filled.push("variant");
  }

  const nameExtract = extractNameFromLines(lines, detectedCategory);
  const name = nameExtract?.name;
  const titleLineIndex = nameExtract?.titleLineIndex;
  if (name !== undefined) filled.push("name");

  const materialLines: string[] = [];
  const fabricationLines: string[] = [];
  const limitedLines: string[] = [];
  const descriptionCandidates: string[] = [];

  for (const sec of tagged) {
    if (sec.kind === "material" && sec.body.trim()) materialLines.push(sec.body);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (titleLineIndex !== undefined && i === titleLineIndex) continue;
    if (isLineExcludedFromDescription(line)) continue;
    if (lineLooksLikeSizeGridOnly(line)) continue;
    if (/^(prix|price)\s*[:\-]/i.test(line) && line.length < 55) continue;
    if (/^(tailles?|sizes?)\s*[:\-]/i.test(line) && line.length < 90) continue;
    if (looksLikeLimitedLine(line)) {
      limitedLines.push(line);
      continue;
    }
    if (RE_FABRICATION_LINE.test(line) && !looksLikeMaterialLine(line)) {
      if (!lineLooksLikeSizeGridOnly(line)) fabricationLines.push(line);
      continue;
    }
    if (looksLikeMaterialLine(line)) {
      materialLines.push(line);
      continue;
    }
    if (lineLooksLikePrintPlacementOnly(line)) continue;
    if (line.length >= 18 || /[.!?]$/.test(line)) descriptionCandidates.push(line);
    else if (line.length >= 8 && !/^\d{2}\b/.test(line) && !isPureCategoryLine(line)) {
      descriptionCandidates.push(line);
    }
  }

  let materials: string | undefined;
  if (materialLines.length > 0) {
    materials = stripPublicSizeFragments(
      trimStoryField(materialLines.map((l) => normalizeStoryBody(l)).join("\n\n")),
    );
    if (materials.length > 0) filled.push("materials");
    else materials = undefined;
  }

  let fabrication: string | undefined;
  if (fabricationLines.length > 0) {
    fabrication = stripPublicSizeFragments(
      trimStoryField(fabricationLines.map((l) => normalizeStoryBody(l)).join("\n\n")),
    );
    if (fabrication.length > 0) filled.push("fabrication");
    else fabrication = undefined;
  }

  let limitedEdition: string | undefined;
  if (limitedLines.length > 0) {
    limitedEdition = stripPublicSizeFragments(
      trimStoryField(limitedLines.map((l) => normalizeStoryBody(l)).join("\n\n")),
    );
    if (limitedEdition.length > 0) filled.push("limitedEdition");
    else limitedEdition = undefined;
  }

  let description: string | undefined;
  const descFiltered = descriptionCandidates.filter((l) => {
    if (!name) return true;
    if (l.trim() === name.trim()) return false;
    if (lineDuplicatesProductName(l, name)) return false;
    return true;
  });
  if (descFiltered.length > 0) {
    description = stripPublicSizeFragments(
      trimStoryField(descFiltered.map((l) => normalizeStoryBody(l)).join("\n\n")),
    );
    if (description.length > 0) filled.push("description");
    else description = undefined;
  } else if (materialLines.length === 0 && lines.length > 1 && name !== undefined) {
    const restParas = lines
      .filter((_, j) => j !== titleLineIndex)
      .filter((l) => !isLineExcludedFromDescription(l))
      .filter((l) => !lineLooksLikeSizeGridOnly(l))
      .filter((l) => !lineDuplicatesProductName(l, name));
    const rest = restParas.join("\n\n");
    const fallback = stripPublicSizeFragments(trimStoryField(normalizeStoryBody(rest)));
    if (fallback.length >= 10) {
      description = fallback;
      filled.push("description");
    }
  }

  const result: SmartProductParseOutput = {
    filled,
    diagnostics: { blockCount: blocks.length || 1, footnoteLinesSkipped: footnoteSkipped },
    semanticBlocks: [],
  };
  if (detectedCategory !== undefined) result.detectedCategory = detectedCategory;
  if (name !== undefined) result.name = name;
  if (description !== undefined) result.description = description;
  if (materials !== undefined) result.materials = materials;
  if (fabrication !== undefined) result.fabrication = fabrication;
  if (limitedEdition !== undefined) result.limitedEdition = limitedEdition;
  if (price !== undefined) result.price = price;
  if (sizes.length > 0) result.sizes = sizes;
  if (variantColor !== undefined) result.variantColor = variantColor;
  if (printPlacementFromPaste !== undefined) result.printPlacement = printPlacementFromPaste;

  result.semanticBlocks = buildMakerSemanticBlocks(result);
  return result;
}

export function buildSmartParseRecap(result: SmartProductParseOutput): string {
  if (result.filled.length === 0) {
    return "Smart collage · aucun champ détecté. Colle un pavé plus explicite (titre, prix, tailles, matière) ou vérifie la catégorie.";
  }
  const lines: string[] = ["Smart collage · détection :"];
  const blocks = result.semanticBlocks.length > 0 ? result.semanticBlocks : buildMakerSemanticBlocks(result);
  for (const b of blocks) {
    lines.push(`• ${b.label} : ${b.value}`);
  }
  lines.push(
    `• Analyse : ${result.diagnostics.blockCount} bloc(s), ${result.diagnostics.footnoteLinesSkipped} ligne(s) * ignorée(s) pour tailles.`,
  );
  return lines.join("\n");
}

export function summarizeSmartParseFilled(filled: readonly SmartParseFieldId[]): string {
  if (filled.length === 0) return "Smart collage · aucun champ détecté — ajuste le texte ou la catégorie.";
  const labels = filled.map((id) => SMART_PARSE_FIELD_LABELS[id]);
  return `Smart collage · champs remplis : ${labels.join(" · ")}.`;
}
