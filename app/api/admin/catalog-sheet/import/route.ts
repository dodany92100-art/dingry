import { requireAdmin } from "@/lib/admin/auth";
import { runCatalogSheetImport, type CatalogSheetImportInput } from "@/lib/admin/catalog-sheet-import-service";
import { catalogSheetCsvFromWorkbookBuffer, isCatalogSpreadsheetFileName } from "@/lib/catalog/catalog-sheet-workbook";
import type { CatalogSheetMergeTextMode } from "@/lib/catalog/catalog-sheet-persist";
import { jsonNoStore } from "@/lib/http";

export const runtime = "nodejs";

type ImportBody = CatalogSheetImportInput & {
  sheet?: { rows?: unknown[] };
};

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const contentType = request.headers.get("content-type") ?? "";

  let body: ImportBody;
  if (contentType.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return jsonNoStore({ error: "Formulaire invalide." }, { status: 400 });
    }
    const file = form.get("file");
    const apply = form.get("apply") === "true" || form.get("apply") === "1";
    const mergeText = String(form.get("mergeText") ?? "fill-empty") as CatalogSheetMergeTextMode;
    if (!(file instanceof File) || file.size === 0) {
      return jsonNoStore({ error: "Fichier requis (.csv, .json, .xlsx…)." }, { status: 400 });
    }
    if (isCatalogSpreadsheetFileName(file.name)) {
      const buffer = await file.arrayBuffer();
      try {
        const csvText = catalogSheetCsvFromWorkbookBuffer(buffer);
        body = { csvText, apply, mergeText };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Fichier Excel illisible.";
        return jsonNoStore({ error: message }, { status: 400 });
      }
    } else {
      const csvText = await file.text();
      body = { csvText, apply, mergeText };
    }
  } else {
    try {
      body = (await request.json()) as ImportBody;
    } catch {
      return jsonNoStore({ error: "JSON invalide." }, { status: 400 });
    }
    if (
      !body.csvText?.trim() &&
      !body.rows &&
      !body.sheet?.rows &&
      !body.googleSheetUrl?.trim() &&
      !(body.candidates && body.candidates.length > 0)
    ) {
      return jsonNoStore(
        { error: "candidates[], csvText, rows[], lien Google Sheets ou fichier requis." },
        { status: 400 },
      );
    }
    if (!body.rows && body.sheet?.rows) {
      body = { ...body, rows: body.sheet.rows };
    }
  }

  try {
    const result = await runCatalogSheetImport(body);
    if (!result.ok) {
      return jsonNoStore(
        {
          error: result.error,
          summary: result.summary,
          errors: result.summary.errors,
          warnings: result.summary.warnings,
          issues: result.issues,
        },
        { status: 400 },
      );
    }
    return jsonNoStore({
      report: result.report,
      rowCount: result.rowCount,
      candidateCount: result.candidateCount,
      summary: result.summary,
      errors: result.summary.errors,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error("Import catalogue", error instanceof Error ? error.name : "erreur");
    return jsonNoStore({ error: "Import catalogue impossible." }, { status: 500 });
  }
}