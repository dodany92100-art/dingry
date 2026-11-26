import type {
  CatalogSheetFieldKey,
  CatalogSheetParseSummary,
  CatalogSheetRow,
  CatalogSheetRowIssue,
} from "@/lib/catalog/sheet/types";
import { CATALOG_SHEET_ISSUE_DEFS } from "@/lib/catalog/sheet/issue-defs";
import { catalogSheetFieldLabel } from "@/lib/catalog/sheet/field-labels";

export { catalogSheetFieldLabel } from "@/lib/catalog/sheet/field-labels";

export function catalogSheetMakeIssue(input: {
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