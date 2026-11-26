import {
  normalizeProductBrand,
  normalizeProductCategory,
  type Brand,
  type ProductCategory,
  type ProductSize,
} from "@/lib/admin/types";
import {
  categoryToSkuTypeCode,
  colorLabelToSkuColorisCode,
  getModelRef,
  isValidSku,
  parseSku,
  type SkuColorisCode,
  type SkuTailleCode,
} from "@/lib/sku";

/** En-têtes feuille CATALOGUE (FR) → clés internes. */
const CATALOG_SHEET_HEADER_ALIASES: Record<string, CatalogSheetFieldKey> = {
  marque: "brand",
  brand: "brand",
  "nom modele": "modelName",
  "nom modèle": "modelName",
  "nom_modele": "modelName",
  modelname: "modelName",
  model_name: "modelName",
  sku: "sku",
  "réf. modèle": "modelRef",
  "ref. modele": "modelRef",
  "ref modele": "modelRef",
  modelref: "modelRef",
  model_ref: "modelRef",
  prixu: "unitPrice",
  "prix u": "unitPrice",
  prix: "unitPrice",
  unitprice: "unitPrice",
  unit_price: "unitPrice",
  catégorie: "category",
  categorie: "category",
  category: "category",
  coloris: "color",
  couleur: "color",
  color: "color",
  taille: "size",
  size: "size",
  genre: "gender",
  gender: "gender",
  "description courte": "shortDescription",
  shortdescription: "shortDescription",
  short_description: "shortDescription",
  "description longue": "longDescription",
  longdescription: "longDescription",
  long_description: "longDescription",
  composition: "composition",
  "points forts": "highlights",
  pointsforts: "highlights",
  highlights: "highlights",
  // clés compactes (sans espaces / ponctuation)
  nommodele: "modelName",
  refmodele: "modelRef",
  descriptioncourte: "shortDescription",
  descriptionlongue: "longDescription",
};

const CATALOG_SHEET_FIELD_KEYS = new Set<string>([
  "brand",
  "modelName",
  "sku",
  "modelRef",
  "unitPrice",
  "category",
  "color",
  "size",
  "gender",
  "shortDescription",
  "longDescription",
  "composition",
  "highlights",
]);

export type CatalogSheetFieldKey =
  | "brand"
  | "modelName"
  | "sku"
  | "modelRef"
  | "unitPrice"
  | "category"
  | "color"
  | "size"
  | "gender"
  | "shortDescription"
  | "longDescription"
  | "composition"
  | "highlights";

/** Une ligne variante (granularité SKU) telle que dans la feuille. */
export type CatalogSheetRow = {
  brand: Brand;
  modelName: string;
  sku: string;
  modelRef: string;
  unitPriceEuro: number;
  category: ProductCategory;
  color: string;
  /** Affichage CRM / boutique (`TU`, `M`, …). */
  size: ProductSize;
  gender: string;
  shortDescription: string;
  longDescription: string;
  composition: string;
  highlights: string;
  /** Index source (1-based, hors en-tête) pour les rapports d’import. */
  sourceLine?: number;
};

export type CatalogSheetRowIssue = {
  level: "error" | "warning";
  code: string;
  /** Explication courte (français). */
  message: string;
  /** Numéro de ligne dans le fichier source (1-based, ligne titre / en-tête ignorés avant données). */
  rowNumber?: number;
  /** @deprecated alias de `rowNumber` (compat). */
  sourceLine?: number;
  sku?: string;
  modelName?: string;
  /** Colonne feuille concernée. */
  field?: CatalogSheetFieldKey | "";
  /** Conseil de correction actionnable. */
  fixHint?: string;
};

export type CatalogSheetParseSummary = {
  validRows: number;
  errorCount: number;
  warningCount: number;
  /** Lignes données contenant au moins une erreur bloquante. */
  rejectedRowNumbers: number[];
  errors: CatalogSheetRowIssue[];
  warnings: CatalogSheetRowIssue[];
};

const CATALOG_SHEET_ISSUE_DEFS: Record<
  string,
  { field?: CatalogSheetFieldKey | ""; fixHint: string; defaultMessage?: string }
> = {
  brand_missing: {
    field: "brand",
    fixHint: "Indique une marque reconnue : FYMA, DINGRY ou ROCK THE STREET (ou laisse le SKU FYM/DIN/RTS déduire la marque).",
    defaultMessage: "Marque manquante ou non reconnue.",
  },
  sku_missing: {
    field: "sku",
    fixHint: "Renseigne un SKU unique par variante (5 blocs séparés par des tirets).",
    defaultMessage: "SKU manquant.",
  },
  sku_invalid: {
    field: "sku",
    fixHint:
      "Format attendu : MARQUE-TYPE-MODELE-COLORIS-TAILLE (ex. FYM-CAP-BRO-NOI-U). Taille unique = bloc final U (pas TU).",
    defaultMessage: "SKU hors convention 5 blocs.",
  },
  model_ref_missing: {
    field: "modelRef",
    fixHint:
      "Renseigne la Réf. modèle (3 premiers blocs du SKU, ex. FYM-CAP-BRO) ou laisse vide si le SKU est valide (déduction auto).",
    defaultMessage: "Réf. modèle manquante.",
  },
  model_ref_sku_mismatch: {
    field: "modelRef",
    fixHint: "La Réf. modèle doit être identique aux 3 premiers segments du SKU (ex. SKU FYM-PUL-FLU-BEI-M → FYM-PUL-FLU).",
    defaultMessage: "Réf. modèle incohérente avec le SKU.",
  },
  model_ref_inferred: {
    field: "modelRef",
    fixHint: "Optionnel : tu peux remplir la colonne Réf. modèle pour contrôle visuel (déjà déduite du SKU).",
    defaultMessage: "Réf. modèle déduite automatiquement du SKU.",
  },
  price_invalid: {
    field: "unitPrice",
    fixHint: "Saisis un nombre positif : 40, 40 €, 60,00 € ou 120.50 EUR (sans texte superflu).",
    defaultMessage: "Prix unitaire illisible ou non positif.",
  },
  category_invalid: {
    field: "category",
    fixHint: "Choisis une catégorie boutique : Caps, T-shirts, Hoodies, Crewnecks, Jerseys, Pants, Crop tops, Hoodzip…",
    defaultMessage: "Catégorie manquante ou inconnue.",
  },
  size_invalid: {
    field: "size",
    fixHint: "Tailles acceptées : XS–XXL, 2XL (→ XXL au SKU), TU/Taille unique/U pour casquettes.",
    defaultMessage: "Taille non reconnue.",
  },
  size_sku_mismatch: {
    field: "size",
    fixHint:
      "Aligne la colonne Taille avec le dernier bloc du SKU (ex. TU en feuille ↔ U dans le SKU ; M ↔ -M).",
    defaultMessage: "Taille de la feuille incompatible avec le SKU.",
  },
  color_missing: {
    field: "color",
    fixHint: "Renseigne le coloris (Noir, Rouge, Beige…) aligné avec le bloc COLORIS du SKU (NOI, ROU, BEI…).",
    defaultMessage: "Coloris manquant.",
  },
  model_name_missing: {
    field: "modelName",
    fixHint: "Donne un libellé produit (NOM MODÈLE) pour l’admin / la boutique.",
    defaultMessage: "NOM MODÈLE manquant.",
  },
  color_sku_drift: {
    field: "color",
    fixHint: "Harmonise le libellé coloris avec le code SKU ou corrige le SKU (ex. Noir → NOI).",
    defaultMessage: "Écart entre coloris saisi et bloc COLORIS du SKU.",
  },
  category_sku_type_drift: {
    field: "category",
    fixHint:
      "Vérifie cohérence catégorie vs type SKU (ex. Crewnecks en boutique avec type PUL dans le SKU FYMA : souvent volontaire).",
    defaultMessage: "Écart catégorie feuille / type SKU.",
  },
  sku_taille_tu_normalized: {
    field: "sku",
    fixHint: "En SKU utilise U pour taille unique ; conserve TU dans la colonne Taille.",
    defaultMessage: "Suffixe SKU -TU converti en -U.",
  },
  csv_empty: {
    fixHint: "Exporte au moins une ligne de données avec les en-têtes (Marque, SKU, Prix…).",
    defaultMessage: "CSV vide ou sans données.",
  },
  csv_header_missing: {
    fixHint: "Ajoute une ligne d’en-têtes avec Marque, SKU, Réf. modèle, PrixU, Catégorie, Coloris, Taille…",
    defaultMessage: "En-têtes de colonnes introuvables.",
  },
  json_invalid: { fixHint: "Envoie un JSON objet avec un tableau rows[].", defaultMessage: "JSON invalide." },
  json_rows_missing: { fixHint: "Ajoute rows[] ou variants[] dans le JSON.", defaultMessage: "Tableau rows[] manquant." },
  row_invalid: { fixHint: "Chaque ligne doit être un objet avec les colonnes catalogue.", defaultMessage: "Ligne invalide." },
  duplicate_size: {
    field: "size",
    fixHint: "Une seule ligne par taille pour un même modèle + coloris ; fusionne ou corrige les SKU en double.",
    defaultMessage: "Doublon de taille avec SKU différents.",
  },
  price_spread: {
    field: "unitPrice",
    fixHint: "Unifie le PrixU pour toutes les tailles d’un même modèle + coloris.",
    defaultMessage: "Prix différents sur des variantes du même coloris.",
  },
};

const FIELD_LABELS: Record<CatalogSheetFieldKey | "", string> = {
  "": "Fichier",
  brand: "Marque",
  modelName: "NOM MODÈLE",
  sku: "SKU",
  modelRef: "Réf. modèle",
  unitPrice: "PrixU",
  category: "Catégorie",
  color: "Coloris",
  size: "Taille",
  gender: "Genre",
  shortDescription: "Description courte",
  longDescription: "Description longue",
  composition: "Composition",
  highlights: "Points forts",
};

export function catalogSheetFieldLabel(field: CatalogSheetFieldKey | "" | undefined): string {
  if (!field) return "Fichier";
  return FIELD_LABELS[field] ?? field;
}

function catalogSheetMakeIssue(input: {
  level: CatalogSheetRowIssue["level"];
  code: string;
  message?: string;
  field?: CatalogSheetFieldKey | "";
  rowNumber?: number;
  sku?: string;
  modelName?: string;
  fixHint?: string;
}): CatalogSheetRowIssue {
  const def = CATALOG_SHEET_ISSUE_DEFS[input.code];
  const rowNumber = input.rowNumber;
  return {
    level: input.level,
    code: input.code,
    message: input.message ?? def?.defaultMessage ?? input.code,
    rowNumber,
    sourceLine: rowNumber,
    sku: input.sku?.trim() || undefined,
    modelName: input.modelName?.trim() || undefined,
    field: input.field ?? def?.field,
    fixHint: input.fixHint ?? def?.fixHint ?? "",
  };
}

export function catalogSheetParseSummary(
  rows: readonly CatalogSheetRow[],
  issues: readonly CatalogSheetRowIssue[],
): CatalogSheetParseSummary {
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");
  const rejectedRowNumbers = [
    ...new Set(
      errors
        .map((issue) => issue.rowNumber ?? issue.sourceLine)
        .filter((n): n is number => typeof n === "number" && n > 0),
    ),
  ].sort((a, b) => a - b);
  return {
    validRows: rows.length,
    errorCount: errors.length,
    warningCount: warnings.length,
    rejectedRowNumbers,
    errors,
    warnings,
  };
}

/** Une ligne lisible pour terminal / logs. */
export function catalogSheetSummaryHeadline(summary: CatalogSheetParseSummary): string {
  const rejected =
    summary.rejectedRowNumbers.length > 0
      ? ` · ${summary.rejectedRowNumbers.length} ligne(s) à corriger (${summary.rejectedRowNumbers.join(", ")})`
      : "";
  return `${summary.validRows} valide(s) · ${summary.errorCount} erreur(s) · ${summary.warningCount} avertissement(s)${rejected}`;
}

export function formatCatalogSheetIssueLine(issue: CatalogSheetRowIssue): string {
  const prefix = issue.level === "error" ? "❌" : "⚠️";
  const row = issue.rowNumber ?? issue.sourceLine;
  const head: string[] = [];
  if (row) head.push(`Ligne ${row}`);
  if (issue.sku) head.push(`SKU ${issue.sku}`);
  if (issue.modelName) head.push(`« ${issue.modelName} »`);
  const field = issue.field ? `Champ « ${catalogSheetFieldLabel(issue.field)} »` : "";
  const meta = [head.join(" · "), field].filter(Boolean).join(" · ");
  const lines = [`${prefix} ${meta} — ${issue.message}`];
  if (issue.fixHint) lines.push(`   → ${issue.fixHint}`);
  return lines.join("\n");
}

export type CatalogSheetModelGroup = {
  modelRef: string;
  rows: readonly CatalogSheetRow[];
};

/** Fiche CRM candidate : une entrée par réf. modèle + coloris (tailles fusionnées). */
export type CatalogSheetCrmCandidate = {
  modelRef: string;
  modelName: string;
  brand: Brand;
  category: ProductCategory;
  color: string;
  colorisCode: SkuColorisCode | null;
  unitPriceEuro: number;
  sizes: ProductSize[];
  /** SKU complet par taille affichée (`TU` → clé `TU`). */
  skuBySize: Record<string, string>;
  gender: string;
  shortDescription: string;
  longDescription: string;
  composition: string;
  highlights: string;
  variantSkus: readonly string[];
};

/** Clé d’en-tête normalisée (sans accents, ponctuation → espaces). */
export function compactCatalogSheetHeaderKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[._]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeCatalogSheetHeader(raw: string): CatalogSheetFieldKey | null {
  const key = compactCatalogSheetHeaderKey(raw);
  const direct = CATALOG_SHEET_HEADER_ALIASES[key];
  if (direct) return direct;
  const compact = key.replace(/\s+/g, "");
  const compactHit = CATALOG_SHEET_HEADER_ALIASES[compact];
  if (compactHit) return compactHit;
  if (CATALOG_SHEET_FIELD_KEYS.has(key)) return key as CatalogSheetFieldKey;
  if (key.startsWith("ref") && key.includes("modele")) return "modelRef";
  if (key.startsWith("nom") && key.includes("modele")) return "modelName";
  if (key === "prix" || key.startsWith("prix")) return "unitPrice";
  if (key.startsWith("desc") && key.includes("court")) return "shortDescription";
  if (key.startsWith("desc") && key.includes("long")) return "longDescription";
  return null;
}

/** Nettoyage codes catalogue (`SKU`, réf. modèle). */
function normalizeCatalogSheetCodeToken(raw: string): string {
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

function normalizeCatalogSheetModelRef(raw: string): string {
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
function normalizeCatalogSheetBrand(raw: string, sku?: string): Brand | null {
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

function normalizeCatalogSheetColorDisplay(raw: string): string {
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

function cellString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeRecordKeys(
  raw: Record<string, unknown>,
): Partial<Record<CatalogSheetFieldKey, string>> {
  const out: Partial<Record<CatalogSheetFieldKey, string>> = {};
  for (const [key, value] of Object.entries(raw)) {
    const field =
      normalizeCatalogSheetHeader(key) ??
      (CATALOG_SHEET_FIELD_KEYS.has(key) ? (key as CatalogSheetFieldKey) : null);
    if (!field) continue;
    const next = cellString(value);
    if (!next && out[field]) continue;
    out[field] = next;
  }
  return out;
}

function isSkippableSheetRow(fields: Partial<Record<CatalogSheetFieldKey, string>>): boolean {
  const sku = fields.sku?.trim() ?? "";
  const name = fields.modelName?.trim() ?? "";
  if (!sku && !name) return true;
  const noise = new Set(["catalogue", "catalog", "inventaire", "stock"]);
  const blob = `${sku} ${name}`.trim().toLowerCase();
  return blob.length > 0 && blob.length < 24 && noise.has(blob);
}

export function parseCatalogSheetRow(
  raw: Record<string, unknown>,
  options?: { sourceLine?: number },
): { row: CatalogSheetRow | null; issues: CatalogSheetRowIssue[] } {
  const fields = normalizeRecordKeys(raw);
  if (isSkippableSheetRow(fields)) {
    return { row: null, issues: [] };
  }

  const issues: CatalogSheetRowIssue[] = [];
  const rowNumber = options?.sourceLine;
  const modelNameDraft = cellString(fields.modelName);
  const skuDraft = normalizeCatalogSheetSku(fields.sku ?? "") || cellString(fields.sku);

  const pushIssue = (
    level: CatalogSheetRowIssue["level"],
    code: string,
    message?: string,
    ctx?: { sku?: string; modelName?: string; field?: CatalogSheetFieldKey | "" },
  ) => {
    issues.push(
      catalogSheetMakeIssue({
        level,
        code,
        message,
        rowNumber,
        sku: ctx?.sku ?? skuDraft,
        modelName: ctx?.modelName ?? modelNameDraft,
        field: ctx?.field,
      }),
    );
  };

  const pushError = (code: string, message?: string, field?: CatalogSheetFieldKey | "") => {
    pushIssue("error", code, message, { field });
  };

  const skuRaw = fields.sku ?? "";
  const sku = normalizeCatalogSheetSku(skuRaw);
  const skuToken = normalizeCatalogSheetCodeToken(skuRaw);
  if (skuRaw.trim() && skuToken.endsWith("-TU") && sku.endsWith("-U")) {
    pushIssue("warning", "sku_taille_tu_normalized", undefined, { sku, field: "sku" });
  }

  const brandRaw = fields.brand ?? "";
  const brand = normalizeCatalogSheetBrand(brandRaw, sku);
  if (!brand) pushError("brand_missing", undefined, "brand");

  if (!sku) pushError("sku_missing", undefined, "sku");
  else if (!isValidSku(sku)) {
    pushError("sku_invalid", `SKU invalide après normalisation : « ${sku} ».`, "sku");
  }

  const modelRefRaw = fields.modelRef ?? "";
  let modelRef = modelRefRaw ? normalizeCatalogSheetModelRef(modelRefRaw) : "";
  if (!modelRef && sku) {
    modelRef = getModelRef(sku) ?? "";
    if (!modelRefRaw.trim() && modelRef) {
      pushIssue("warning", "model_ref_inferred", `Réf. modèle déduite du SKU : ${modelRef}.`, {
        sku,
        field: "modelRef",
      });
    }
  }
  if (!modelRef) pushError("model_ref_missing", undefined, "modelRef");
  else if (sku && getModelRef(sku) && getModelRef(sku) !== modelRef) {
    pushError(
      "model_ref_sku_mismatch",
      `Réf. modèle « ${modelRef} » ≠ réf. dérivée du SKU (${getModelRef(sku)}).`,
      "modelRef",
    );
  }

  const unitPriceEuro = parseCatalogSheetUnitPrice(fields.unitPrice ?? "");
  if (unitPriceEuro === null) {
    pushError("price_invalid", `PrixU illisible : « ${fields.unitPrice ?? ""} ».`, "unitPrice");
  }

  const categoryRaw = fields.category ?? "";
  const category = categoryRaw.trim() ? normalizeProductCategory(categoryRaw.trim()) : null;
  if (!categoryRaw.trim()) pushError("category_invalid", `Catégorie vide ou manquante.`, "category");

  const sizeRaw = fields.size ?? "";
  const skuTaille = catalogDisplaySizeToSkuTaille(sizeRaw);
  if (!skuTaille) pushError("size_invalid", `Taille non reconnue : « ${sizeRaw} ».`, "size");
  const size: ProductSize = !skuTaille
    ? sizeRaw
    : skuTaille === "XXL" && /^2\s*xl$/i.test(sizeRaw.trim())
      ? "2XL"
      : skuTailleToCatalogDisplaySize(skuTaille);

  const color = normalizeCatalogSheetColorDisplay(fields.color ?? "");
  if (!color) pushError("color_missing", undefined, "color");

  const modelName = cellString(fields.modelName);
  if (!modelName) pushError("model_name_missing", undefined, "modelName");

  if (issues.some((i) => i.level === "error")) {
    return { row: null, issues };
  }

  const parsedSku = parseSku(sku);
  if (parsedSku && skuTaille && parsedSku.taille !== skuTaille) {
    pushIssue(
      "error",
      "size_sku_mismatch",
      `Colonne Taille « ${size} » incompatible avec le bloc taille du SKU (${parsedSku.taille}).`,
      { sku, modelName, field: "size" },
    );
    return { row: null, issues };
  }

  if (parsedSku && color) {
    const expectedColoris = colorLabelToSkuColorisCode(color);
    if (expectedColoris && expectedColoris !== parsedSku.coloris) {
      pushIssue(
        "warning",
        "color_sku_drift",
        `Coloris « ${color} » → code ${expectedColoris}, le SKU indique ${parsedSku.coloris}.`,
        { sku, modelName, field: "color" },
      );
    }
  }

  if (parsedSku && category) {
    const categoryType = categoryToSkuTypeCode(category);
    if (categoryType && categoryType !== parsedSku.type) {
      pushIssue(
        "warning",
        "category_sku_type_drift",
        `Catégorie « ${category} » (type ${categoryType}) vs type SKU ${parsedSku.type}.`,
        { sku, modelName, field: "category" },
      );
    }
  }

  const row: CatalogSheetRow = {
    brand: brand!,
    modelName,
    sku,
    modelRef,
    unitPriceEuro: unitPriceEuro!,
    category: category!,
    color,
    size,
    gender: cellString(fields.gender) || "Unisexe",
    shortDescription: cellString(fields.shortDescription),
    longDescription: cellString(fields.longDescription),
    composition: cellString(fields.composition),
    highlights: cellString(fields.highlights),
    sourceLine: options?.sourceLine,
  };

  return { row, issues };
}

export function groupCatalogSheetByModelRef(rows: readonly CatalogSheetRow[]): CatalogSheetModelGroup[] {
  const map = new Map<string, CatalogSheetRow[]>();
  for (const row of rows) {
    const bucket = map.get(row.modelRef) ?? [];
    bucket.push(row);
    map.set(row.modelRef, bucket);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([modelRef, grouped]) => ({ modelRef, rows: grouped }));
}

function colorGroupKey(row: CatalogSheetRow): string {
  const parsed = parseSku(row.sku);
  const coloris = parsed?.coloris ?? colorLabelToSkuColorisCode(row.color) ?? row.color.toUpperCase();
  return `${row.modelRef}::${coloris}`;
}

/** Regroupe en fiches CRM (réf. modèle + coloris), tailles et SKU par taille. */
export function catalogSheetCrmCandidates(rows: readonly CatalogSheetRow[]): {
  candidates: CatalogSheetCrmCandidate[];
  issues: CatalogSheetRowIssue[];
} {
  const map = new Map<string, CatalogSheetRow[]>();
  for (const row of rows) {
    const key = colorGroupKey(row);
    const bucket = map.get(key) ?? [];
    bucket.push(row);
    map.set(key, bucket);
  }

  const candidates: CatalogSheetCrmCandidate[] = [];
  const issues: CatalogSheetRowIssue[] = [];

  for (const [, bucket] of map) {
    const first = bucket[0]!;
    const parsed = parseSku(first.sku);
    const colorisCode = parsed?.coloris ?? colorLabelToSkuColorisCode(first.color);

    const prices = new Set(bucket.map((r) => r.unitPriceEuro));
    if (prices.size > 1) {
      issues.push(
        catalogSheetMakeIssue({
          level: "warning",
          code: "price_spread",
          message: `Prix différents pour ${first.modelRef} / ${first.color} (${[...prices].join(", ")} €).`,
          sku: first.sku,
          modelName: first.modelName,
          field: "unitPrice",
        }),
      );
    }

    const skuBySize: Record<string, string> = {};
    const sizes: ProductSize[] = [];
    for (const row of bucket) {
      const sizeKey = String(row.size);
      if (skuBySize[sizeKey] && skuBySize[sizeKey] !== row.sku) {
        issues.push(
          catalogSheetMakeIssue({
            level: "error",
            code: "duplicate_size",
            message: `Doublon taille ${sizeKey} avec SKU différents.`,
            rowNumber: row.sourceLine,
            sku: row.sku,
            modelName: row.modelName,
            field: "size",
          }),
        );
      }
      skuBySize[sizeKey] = row.sku;
      if (!sizes.includes(row.size)) sizes.push(row.size);
    }

    const storySource =
      bucket.find((r) => r.longDescription.trim().length > 0) ??
      bucket.find((r) => r.shortDescription.trim().length > 0) ??
      first;

    candidates.push({
      modelRef: first.modelRef,
      modelName: first.modelName,
      brand: first.brand,
      category: first.category,
      color: first.color,
      colorisCode,
      unitPriceEuro: first.unitPriceEuro,
      sizes,
      skuBySize,
      gender: first.gender,
      shortDescription: storySource.shortDescription,
      longDescription: storySource.longDescription,
      composition: storySource.composition || first.composition,
      highlights: storySource.highlights || first.highlights,
      variantSkus: bucket.map((r) => r.sku),
    });
  }

  candidates.sort((a, b) =>
    a.modelRef === b.modelRef
      ? a.color.localeCompare(b.color, "fr")
      : a.modelRef.localeCompare(b.modelRef),
  );

  return { candidates, issues };
}

function detectCsvDelimiter(headerLine: string): "," | ";" | "\t" {
  const counts: { delim: "," | ";" | "\t"; n: number }[] = [
    { delim: ";", n: (headerLine.match(/;/g) ?? []).length },
    { delim: ",", n: (headerLine.match(/,/g) ?? []).length },
    { delim: "\t", n: (headerLine.match(/\t/g) ?? []).length },
  ];
  counts.sort((a, b) => b.n - a.n);
  return counts[0]!.n > 0 ? counts[0]!.delim : ";";
}

function splitCsvLine(line: string, delim: "," | ";" | "\t"): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && ch === delim) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function isDecorativeCatalogueCsvLine(line: string, delim: "," | ";" | "\t"): boolean {
  const cells = splitCsvLine(line, delim);
  const text = cells
    .map((c) => c.trim())
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (!text) return true;
  if (text === "catalogue" || text === "catalog") return true;
  return false;
}

function countMappedCsvHeaders(line: string, delim: "," | ";" | "\t"): number {
  return splitCsvLine(line, delim).filter((h) => normalizeCatalogSheetHeader(h) !== null).length;
}

/** Import CSV export Excel (séparateur `;` ou `,`, en-têtes FR). */
export function parseCatalogSheetCsv(text: string): {
  rows: CatalogSheetRow[];
  issues: CatalogSheetRowIssue[];
} {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) {
    return {
      rows: [],
      issues: [catalogSheetMakeIssue({ level: "error", code: "csv_empty" })],
    };
  }

  let headerLineIndex = 0;
  let delim = detectCsvDelimiter(lines[0]!);
  let bestScore = countMappedCsvHeaders(lines[0]!, delim);
  for (let i = 0; i < Math.min(lines.length, 8); i += 1) {
    const candidateDelim = detectCsvDelimiter(lines[i]!);
    const score = countMappedCsvHeaders(lines[i]!, candidateDelim);
    if (score >= 3 && score >= bestScore) {
      headerLineIndex = i;
      delim = candidateDelim;
      bestScore = score;
    }
  }

  if (bestScore < 3) {
    return {
      rows: [],
      issues: [catalogSheetMakeIssue({ level: "error", code: "csv_header_missing" })],
    };
  }

  const headers = splitCsvLine(lines[headerLineIndex]!, delim);
  const fieldIndexes: (CatalogSheetFieldKey | null)[] = headers.map((h) => normalizeCatalogSheetHeader(h));

  const rows: CatalogSheetRow[] = [];
  const issues: CatalogSheetRowIssue[] = [];

  for (let i = headerLineIndex + 1; i < lines.length; i += 1) {
    const line = lines[i]!;
    if (isDecorativeCatalogueCsvLine(line, delim)) continue;
    const cells = splitCsvLine(line, delim);
    const record: Record<string, unknown> = {};
    fieldIndexes.forEach((field, idx) => {
      if (!field) return;
      record[field] = cells[idx] ?? "";
    });
    const parsed = parseCatalogSheetRow(record, { sourceLine: i + 1 });
    issues.push(...parsed.issues);
    if (parsed.row) rows.push(parsed.row);
  }

  return { rows, issues };
}

export function parseCatalogSheetJson(
  payload: unknown,
): { rows: CatalogSheetRow[]; issues: CatalogSheetRowIssue[] } {
  if (!payload || typeof payload !== "object") {
    return {
      rows: [],
      issues: [catalogSheetMakeIssue({ level: "error", code: "json_invalid" })],
    };
  }
  const body = payload as Record<string, unknown>;
  const list = Array.isArray(body.rows)
    ? body.rows
    : Array.isArray(body.variants)
      ? body.variants
      : Array.isArray(payload)
        ? payload
        : null;
  if (!list) {
    return {
      rows: [],
      issues: [catalogSheetMakeIssue({ level: "error", code: "json_rows_missing" })],
    };
  }

  const rows: CatalogSheetRow[] = [];
  const issues: CatalogSheetRowIssue[] = [];
  list.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      issues.push(
        catalogSheetMakeIssue({
          level: "error",
          code: "row_invalid",
          message: `Entrée ${index + 1} : objet attendu.`,
          rowNumber: index + 1,
        }),
      );
      return;
    }
    const parsed = parseCatalogSheetRow(item as Record<string, unknown>, { sourceLine: index + 1 });
    issues.push(...parsed.issues);
    if (parsed.row) rows.push(parsed.row);
  });
  return { rows, issues };
}

const CATALOG_SIZE_SORT_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "TU", "U"] as const;

function catalogSheetSizeSortIndex(size: string): number {
  const index = CATALOG_SIZE_SORT_ORDER.indexOf(size as (typeof CATALOG_SIZE_SORT_ORDER)[number]);
  return index >= 0 ? index : 99;
}

/** SKU représentatif (taille la plus « centrale » disponible). */
export function catalogSheetPrimarySku(candidate: CatalogSheetCrmCandidate): string {
  const ordered = [...candidate.sizes].sort(
    (a, b) => catalogSheetSizeSortIndex(String(a)) - catalogSheetSizeSortIndex(String(b)),
  );
  for (const size of ordered) {
    const sku = candidate.skuBySize[String(size)];
    if (sku) return sku;
  }
  return candidate.variantSkus[0] ?? candidate.modelRef;
}

/** Clé d’idempotence import : marque + réf. modèle + coloris SKU. */
export function catalogSheetImportKey(candidate: CatalogSheetCrmCandidate): string {
  const coloris = candidate.colorisCode ?? candidate.color.trim().toUpperCase();
  return `${candidate.brand}::${candidate.modelRef}::${coloris}`;
}

/** Projection minimale vers champs admin (sans écriture DB). */
export function catalogSheetCandidateToAdminDraft(candidate: CatalogSheetCrmCandidate): {
  sku: string;
  name: string;
  variant: string;
  brand: Brand;
  category: ProductCategory;
  price: number;
  sizes: ProductSize[];
  description: string;
  materials: string;
  fabrication: string;
  limitedEdition: string;
} {
  return {
    sku: catalogSheetPrimarySku(candidate),
    name: candidate.modelName,
    variant: candidate.color,
    brand: candidate.brand,
    category: candidate.category,
    price: candidate.unitPriceEuro,
    sizes: candidate.sizes,
    description: candidate.longDescription || candidate.shortDescription,
    materials: candidate.composition,
    fabrication: candidate.highlights,
    limitedEdition: candidate.shortDescription,
  };
}