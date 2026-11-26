import type { CatalogSheetApplyReport } from "@/lib/admin/apply-catalog-sheet-import";
import {
  catalogSheetCrmCandidates,
  catalogSheetParseSummary,
  parseCatalogSheetCsv,
  parseCatalogSheetJson,
  type CatalogSheetCrmCandidate,
  type CatalogSheetParseSummary,
  type CatalogSheetRowIssue,
} from "@/lib/catalog/catalog-sheet";
import { catalogSheetCsvFromWorkbookBuffer, isCatalogSpreadsheetFileName } from "@/lib/catalog/catalog-sheet-workbook";
import { compactCatalogCandidatesForWire } from "@/lib/catalog/catalog-sheet-persist";

export const CATALOG_SHEET_FILE_ACCEPT =
  ".csv,.json,.xlsx,.xls,.xlsm,.xlsb,.ods,text/csv,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";

export function isCatalogSheetImportFile(file: File): boolean {
  const lower = file.name.trim().toLowerCase();
  if (!lower) return false;
  if (lower.endsWith(".json") || lower.endsWith(".csv")) return true;
  return isCatalogSpreadsheetFileName(file.name);
}

export type CatalogSheetClientPrepared =
  | {
      ok: true;
      rowCount: number;
      candidates: CatalogSheetCrmCandidate[];
      summary: CatalogSheetParseSummary;
    }
  | {
      ok: false;
      error: string;
      summary: CatalogSheetParseSummary;
    };

/** Parse + regroupement CRM 100 % navigateur (aucun appel API). */
function prepareCatalogRowsOnClient(payload: CatalogSheetFilePayload) {
  if (payload.kind === "csv") return parseCatalogSheetCsv(payload.csvText);
  return parseCatalogSheetJson({ rows: payload.rows });
}

export function prepareCatalogSheetOnClient(
  payload: CatalogSheetFilePayload,
): CatalogSheetClientPrepared {
  const parsed = prepareCatalogRowsOnClient(payload);
  const summary = catalogSheetParseSummary(parsed.rows, parsed.issues);
  if (summary.errorCount > 0) {
    return {
      ok: false,
      error: `Feuille : ${summary.errorCount} erreur(s) sur ${summary.rejectedRowNumbers.length} ligne(s).`,
      summary,
    };
  }
  if (parsed.rows.length === 0) {
    return {
      ok: false,
      error: "Aucune ligne produit dans le fichier.",
      summary,
    };
  }
  const { candidates, issues } = catalogSheetCrmCandidates(parsed.rows);
  const combined = catalogSheetParseSummary(parsed.rows, [...parsed.issues, ...issues]);
  if (combined.errorCount > 0) {
    return {
      ok: false,
      error: `Regroupement CRM : ${combined.errorCount} erreur(s).`,
      summary: combined,
    };
  }
  if (candidates.length === 0) {
    return {
      ok: false,
      error: "Aucune fiche CRM générée.",
      summary: combined,
    };
  }
  return {
    ok: true,
    rowCount: parsed.rows.length,
    candidates: compactCatalogCandidatesForWire(candidates),
    summary: combined,
  };
}

export type CatalogSheetImportClientResult =
  | {
      ok: true;
      rowCount: number;
      candidateCount: number;
      summary: CatalogSheetParseSummary;
      warnings: CatalogSheetRowIssue[];
      report: CatalogSheetApplyReport;
    }
  | {
      ok: false;
      status: number;
      error: string;
      summary?: CatalogSheetParseSummary;
      issues?: CatalogSheetRowIssue[];
    };

export async function postAdminCatalogSheetImport(body: {
  csvText?: string;
  rows?: unknown[];
  candidates?: CatalogSheetCrmCandidate[];
  rowCount?: number;
  googleSheetUrl?: string;
  apply?: boolean;
  mergeText?: "fill-empty" | "overwrite";
}): Promise<CatalogSheetImportClientResult> {
  const response = await fetch("/api/admin/catalog-sheet/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        error?: string;
        issues?: CatalogSheetRowIssue[];
        summary?: CatalogSheetParseSummary;
        rowCount?: number;
        candidateCount?: number;
        warnings?: CatalogSheetRowIssue[];
        report?: CatalogSheetApplyReport;
      }
    | null;

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? "Import impossible.",
      summary: payload?.summary,
      issues: payload?.issues ?? payload?.summary?.errors,
    };
  }

  if (!payload?.report || !payload.summary) {
    return { ok: false, status: 500, error: "Réponse serveur incomplète." };
  }

  return {
    ok: true,
    rowCount: payload.rowCount ?? 0,
    candidateCount: payload.candidateCount ?? 0,
    summary: payload.summary,
    warnings: payload.warnings ?? payload.summary.warnings,
    report: payload.report,
  };
}

export type CatalogSheetFilePayload =
  | { kind: "csv"; csvText: string }
  | { kind: "json"; rows: unknown[] };

/** Lit CSV / JSON / Excel (.xlsx…) ou export Google Sheets téléchargé. */
export async function readCatalogSheetFile(file: File): Promise<CatalogSheetFilePayload> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".json")) {
    const text = await file.text();
    const parsed = JSON.parse(text) as unknown;
    if (Array.isArray(parsed)) return { kind: "json", rows: parsed };
    if (parsed && typeof parsed === "object" && Array.isArray((parsed as { rows?: unknown[] }).rows)) {
      return { kind: "json", rows: (parsed as { rows: unknown[] }).rows };
    }
    throw new Error("JSON : attendu rows[] ou un tableau à la racine.");
  }
  if (isCatalogSpreadsheetFileName(file.name)) {
    const buffer = await file.arrayBuffer();
    const csvText = catalogSheetCsvFromWorkbookBuffer(buffer);
    return { kind: "csv", csvText };
  }
  const text = await file.text();
  return { kind: "csv", csvText: text };
}