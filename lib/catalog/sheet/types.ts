import type { Brand, ProductCategory, ProductSize } from "@/lib/admin/types";
import type { SkuColorisCode } from "@/lib/sku";

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
