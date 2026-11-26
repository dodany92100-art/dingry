import type {
  CatalogSheetCrmCandidate,
  CatalogSheetParseSummary,
  CatalogSheetRow,
  CatalogSheetRowIssue,
} from "@/lib/catalog/catalog-sheet";
import type { CatalogSheetMergeTextMode } from "@/lib/catalog/catalog-sheet-persist";

export type CatalogSheetApplyReportStub = {
  dryRun: boolean;
  created: { importKey: string; productId?: string; primarySku: string }[];
  updated: { importKey: string; productId: string; primarySku: string }[];
  unchanged: { importKey: string; productId: string }[];
  errors: { importKey: string; message: string }[];
  genderPendingSchema: boolean;
  unmatchedFields: readonly string[];
};

export type CatalogSheetImportInput = {
  csvText?: string;
  rows?: unknown[];
  candidates?: CatalogSheetCrmCandidate[];
  rowCount?: number;
  googleSheetUrl?: string;
  apply?: boolean;
  dryRun?: boolean;
  mergeText?: CatalogSheetMergeTextMode;
};

export type CatalogSheetImportPrepared = {
  rows: CatalogSheetRow[];
  candidates: CatalogSheetCrmCandidate[];
  parseIssues: CatalogSheetRowIssue[];
  summary: CatalogSheetParseSummary;
};