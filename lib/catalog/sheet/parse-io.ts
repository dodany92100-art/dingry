import type { CatalogSheetFieldKey, CatalogSheetRow, CatalogSheetRowIssue } from "@/lib/catalog/sheet/types";
import { normalizeCatalogSheetHeader } from "@/lib/catalog/sheet/headers";
import { catalogSheetMakeIssue } from "@/lib/catalog/sheet/diagnostics";
import { parseCatalogSheetRow } from "@/lib/catalog/sheet/parse-row";

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
