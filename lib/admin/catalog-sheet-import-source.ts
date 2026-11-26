import {
  fetchGoogleSheetWorkbookBuffer,
  parseGoogleSpreadsheetUrl,
} from "@/lib/admin/catalog-sheet-google-url";
import { catalogSheetCsvFromWorkbookBuffer } from "@/lib/catalog/catalog-sheet-workbook";
import type { CatalogSheetImportInput } from "@/lib/admin/catalog-sheet-import-types";

export async function resolveCatalogSheetSource(
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