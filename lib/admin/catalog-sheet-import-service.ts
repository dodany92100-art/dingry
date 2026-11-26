import { catalogSheetCrmCandidates, catalogSheetParseSummary } from "@/lib/catalog/catalog-sheet";
import {
  prepareCatalogSheetFromCandidates,
  prepareCatalogSheetImport,
} from "@/lib/admin/catalog-sheet-import-prepare";
import { resolveCatalogSheetSource } from "@/lib/admin/catalog-sheet-import-source";
import type {
  CatalogSheetApplyReportStub,
  CatalogSheetImportInput,
  CatalogSheetImportPrepared,
} from "@/lib/admin/catalog-sheet-import-types";
import type { CatalogSheetParseSummary, CatalogSheetRowIssue } from "@/lib/catalog/catalog-sheet";

export type {
  CatalogSheetApplyReportStub,
  CatalogSheetImportInput,
  CatalogSheetImportPrepared,
} from "@/lib/admin/catalog-sheet-import-types";

export { prepareCatalogSheetImport } from "@/lib/admin/catalog-sheet-import-prepare";

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
    prepared = prepareCatalogSheetFromCandidates({
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