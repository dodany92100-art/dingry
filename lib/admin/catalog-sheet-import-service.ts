import {
  fetchGoogleSheetWorkbookBuffer,
  parseGoogleSpreadsheetUrl,
} from "@/lib/admin/catalog-sheet-google-url";
import {
  catalogSheetCrmCandidates,
  catalogSheetParseSummary,
  parseCatalogSheetCsv,
  parseCatalogSheetJson,
  type CatalogSheetCrmCandidate,
  type CatalogSheetParseSummary,
  type CatalogSheetRow,
  type CatalogSheetRowIssue,
} from "@/lib/catalog/catalog-sheet";
import { catalogSheetCsvFromWorkbookBuffer } from "@/lib/catalog/catalog-sheet-workbook";
import {
  compactCatalogCandidatesForWire,
  validateCatalogSheetCandidates,
  type CatalogSheetMergeTextMode,
} from "@/lib/catalog/catalog-sheet-persist";
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

async function resolveCatalogSheetSource(
  input: Pick<CatalogSheetImportInput, "csvText" | "rows" | "googleSheetUrl">,
): Promise<{ csvText?: string; rows?: unknown[] } | { error: string }> {
  const sheetUrl = input.googleSheetUrl?.trim();
  if (sheetUrl) {
    const parsed = parseGoogleSpreadsheetUrl(sheetUrl);
    if (!parsed) {
      return {
        error: "Lien Google Sheets invalide — colle l’URL complète (docs.google.com/spreadsheets/d/…).",
      };
    }
    try {
      const buffer = await fetchGoogleSheetWorkbookBuffer(parsed.spreadsheetId, parsed.gid);
      const csvText = catalogSheetCsvFromWorkbookBuffer(buffer);
      return { csvText };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Impossible de lire Google Sheets.",
      };
    }
  }
  return { csvText: input.csvText, rows: input.rows };
}

export type CatalogSheetImportPrepared = {
  rows: CatalogSheetRow[];
  candidates: CatalogSheetCrmCandidate[];
  parseIssues: CatalogSheetRowIssue[];
  summary: CatalogSheetParseSummary;
};

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

function prepareFromCandidates(input: {
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
  const summary = catalogSheetParseSummary(
  [],
    [],
  );
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

export async function runCatalogSheetImport(
  input: CatalogSheetImportInput,
): Promise<
  | {
      ok: true;
      rowCount: number;
      candidateCount: number;
      summary: CatalogSheetParseSummary;
      warnings: CatalogSheetRowIssue[];
      report: CatalogSheetApplyReportStub;
    }
  | { ok: false; error: string; summary: CatalogSheetParseSummary; issues: CatalogSheetRowIssue[] }
> {
  let prepared:
    | { ok: true; data: CatalogSheetImportPrepared }
    | { ok: false; error: string; summary: CatalogSheetParseSummary; issues: CatalogSheetRowIssue[] };

  if (input.candidates && input.candidates.length > 0) {
    prepared = prepareFromCandidates({
      candidates: input.candidates,
      rowCount: input.rowCount,
    });
  } else {
    const resolved = await resolveCatalogSheetSource(input);
    if ("error" in resolved) {
      const emptySummary = catalogSheetParseSummary([], [
        {
          level: "error",
          code: "json_rows_missing",
          message: resolved.error,
        },
      ]);
      return { ok: false, error: resolved.error, summary: emptySummary, issues: emptySummary.errors };
    }
    const fromFile = prepareCatalogSheetImport(resolved);
    if (!fromFile.ok) return fromFile;
    if (!fromFile.data.candidates) {
      const { candidates, issues } = catalogSheetCrmCandidates(fromFile.data.rows);
      prepared = {
        ok: true,
        data: {
          rows: fromFile.data.rows,
          candidates,
          parseIssues: [...fromFile.data.parseIssues, ...issues],
          summary: catalogSheetParseSummary(fromFile.data.rows, [
            ...fromFile.data.parseIssues,
            ...issues,
          ]),
        },
      };
    } else {
      prepared = {
        ok: true,
        data: {
          rows: fromFile.data.rows,
          candidates: fromFile.data.candidates,
          parseIssues: fromFile.data.parseIssues,
          summary: fromFile.data.summary,
        },
      };
    }
  }

  if (!prepared.ok) return prepared;

  const { candidates, parseIssues, summary, rows } = prepared.data;
  const sheetWarnings = summary.warnings;
  const dryRun =
    input.apply === true ? (input.dryRun ?? false) : input.dryRun !== undefined ? input.dryRun : true;

  const { applyCatalogSheetImport } = await import("@/lib/admin/apply-catalog-sheet-import");
  const report = await applyCatalogSheetImport({
    candidates,
    dryRun,
    mergeText: input.mergeText ?? "fill-empty",
  });

  const combinedSummary =
    rows.length > 0
      ? catalogSheetParseSummary(rows, [...parseIssues, ...summary.warnings])
      : summary;

  return {
    ok: true,
    rowCount: rows.length || input.rowCount || candidates.length,
    candidateCount: candidates.length,
    summary: combinedSummary,
    warnings: sheetWarnings,
    report,
  };
}