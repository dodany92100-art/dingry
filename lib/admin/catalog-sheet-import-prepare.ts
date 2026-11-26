import {
  catalogSheetCrmCandidates,
  catalogSheetParseSummary,
  parseCatalogSheetCsv,
  parseCatalogSheetJson,
  type CatalogSheetCrmCandidate,
  type CatalogSheetParseSummary,
  type CatalogSheetRowIssue,
} from "@/lib/catalog/catalog-sheet";
import {
  compactCatalogCandidatesForWire,
  validateCatalogSheetCandidates,
} from "@/lib/catalog/catalog-sheet-persist";
import type { CatalogSheetImportPrepared } from "@/lib/admin/catalog-sheet-import-types";

export function prepareCatalogSheetImport(input: {
  csvText?: string;
  rows?: unknown[];
}):
  | { ok: true; data: Omit<CatalogSheetImportPrepared, "candidates"> & { candidates?: CatalogSheetCrmCandidate[] } }
  | { ok: false; error: string; summary: CatalogSheetParseSummary; issues: CatalogSheetRowIssue[] } {
  const csv = input.csvText?.trim();
  if (csv) {
    const parsed = parseCatalogSheetCsv(csv);
    const summary = catalogSheetParseSummary(parsed.rows, parsed.issues);
    if (summary.errorCount > 0) {
      return {
        ok: false,
        error: `Feuille CSV : ${summary.errorCount} erreur(s) sur ${summary.rejectedRowNumbers.length} ligne(s).`,
        summary,
        issues: summary.errors,
      };
    }
    if (parsed.rows.length === 0) {
      return {
        ok: false,
        error: "Aucune ligne produit dans le CSV.",
        summary,
        issues: summary.errors,
      };
    }
    const { candidates, issues: crmIssues } = catalogSheetCrmCandidates(parsed.rows);
    const combined = catalogSheetParseSummary(parsed.rows, [...parsed.issues, ...crmIssues]);
    return {
      ok: true,
      data: {
        rows: parsed.rows,
        parseIssues: [...parsed.issues, ...crmIssues],
        summary: combined,
        candidates,
      },
    };
  }

  const rawRows = input.rows;
  if (Array.isArray(rawRows)) {
    const parsed = parseCatalogSheetJson({ rows: rawRows });
    const summary = catalogSheetParseSummary(parsed.rows, parsed.issues);
    if (summary.errorCount > 0) {
      return {
        ok: false,
        error: `Feuille JSON : ${summary.errorCount} erreur(s).`,
        summary,
        issues: summary.errors,
      };
    }
    if (parsed.rows.length === 0) {
      return {
        ok: false,
        error: "Aucune variante valide.",
        summary,
        issues: summary.errors,
      };
    }
    const { candidates, issues: crmIssues } = catalogSheetCrmCandidates(parsed.rows);
    const combined = catalogSheetParseSummary(parsed.rows, [...parsed.issues, ...crmIssues]);
    return {
      ok: true,
      data: {
        rows: parsed.rows,
        parseIssues: [...parsed.issues, ...crmIssues],
        summary: combined,
        candidates,
      },
    };
  }

  const emptySummary = catalogSheetParseSummary([], [
    {
      level: "error",
      code: "json_rows_missing",
      message: "Fournir csvText (fichier CSV) ou rows[] (JSON).",
      fixHint:
        "Dépose un .csv, .json, .xlsx (Excel / Google Sheets) ou colle un lien Google Sheets partagé en lecture.",
    },
  ]);
  return {
    ok: false,
    error: "Fournir csvText, rows[], un fichier Excel ou un lien Google Sheets.",
    summary: emptySummary,
    issues: emptySummary.errors,
  };
}

export function prepareCatalogSheetFromCandidates(input: {
  candidates: CatalogSheetCrmCandidate[];
  rowCount?: number;
}):
  | { ok: true; data: CatalogSheetImportPrepared }
  | { ok: false; error: string; summary: CatalogSheetParseSummary; issues: CatalogSheetRowIssue[] } {
  const compact = compactCatalogCandidatesForWire(input.candidates);
  const validation = validateCatalogSheetCandidates(compact);
  if (!validation.ok) {
    const emptySummary = catalogSheetParseSummary([], [
      { level: "error", code: "row_invalid", message: validation.message },
    ]);
    return { ok: false, error: validation.message, summary: emptySummary, issues: emptySummary.errors };
  }
  const rowCount = input.rowCount ?? compact.length;
  const summary = catalogSheetParseSummary([], []);
  const summaryWithCounts: CatalogSheetParseSummary = {
    ...summary,
    validRows: rowCount,
    errorCount: 0,
    warningCount: 0,
    rejectedRowNumbers: [],
    errors: [],
    warnings: [],
  };
  return {
    ok: true,
    data: {
      rows: [],
      candidates: compact,
      parseIssues: [],
      summary: summaryWithCounts,
    },
  };
}