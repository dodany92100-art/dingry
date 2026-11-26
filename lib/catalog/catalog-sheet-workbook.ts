import * as XLSX from "xlsx";
import { parseCatalogSheetCsv } from "@/lib/catalog/catalog-sheet";

const SPREADSHEET_EXTENSIONS = [".xlsx", ".xls", ".xlsm", ".xlsb", ".ods"] as const;

export function isCatalogSpreadsheetFileName(fileName: string): boolean {
  const lower = fileName.trim().toLowerCase();
  return SPREADSHEET_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function isXlsxZipBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 2) return false;
  const head = new Uint8Array(buffer.slice(0, 2));
  return head[0] === 0x50 && head[1] === 0x4b;
}

function spreadsheetCellToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : String(value);
  }
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

/** Matrice feuille → CSV `;` (même logique que export Excel FR). */
export function catalogSheetMatrixToCsv(matrix: unknown[][]): string {
  const lines: string[] = [];
  for (const row of matrix) {
    const cells = (row ?? []).map((cell) => spreadsheetCellToString(cell));
    if (!cells.some((c) => c.length > 0)) continue;
    const escaped = cells.map((cell) => {
      if (cell.includes('"') || cell.includes(";") || cell.includes("\n") || cell.includes("\r")) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    });
    lines.push(escaped.join(";"));
  }
  return lines.join("\n");
}

function sheetToMatrix(sheet: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: false,
  }) as unknown[][];
}

function scoreCatalogCsv(csv: string): number {
  const parsed = parseCatalogSheetCsv(csv);
  if (parsed.issues.some((i) => i.code === "csv_header_missing" || i.code === "csv_empty")) return -1;
  return parsed.rows.length;
}

function pickWorkbookSheet(workbook: XLSX.WorkBook): XLSX.WorkSheet {
  let bestSheet: XLSX.WorkSheet | null = null;
  let bestScore = -1;

  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const matrix = sheetToMatrix(sheet);
    const csv = catalogSheetMatrixToCsv(matrix);
    let score = scoreCatalogCsv(csv);
    const norm = name
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase();
    if (norm.includes("catalog")) score += 50;
    if (score > bestScore) {
      bestScore = score;
      bestSheet = sheet;
    }
  }

  if (!bestSheet) {
    const first = workbook.SheetNames[0];
    if (!first || !workbook.Sheets[first]) {
      throw new Error("Classeur vide : aucune feuille lisible.");
    }
    return workbook.Sheets[first]!;
  }
  return bestSheet;
}

/** Lit un export Excel / Google Sheets (.xlsx) et produit du texte pour `parseCatalogSheetCsv`. */
export function catalogSheetCsvFromWorkbookBuffer(buffer: ArrayBuffer): string {
  if (buffer.byteLength === 0) {
    throw new Error("Fichier Excel vide.");
  }
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(new Uint8Array(buffer), { type: "array", cellDates: true });
  } catch {
    throw new Error("Fichier Excel illisible — enregistre en .xlsx depuis Excel ou Google Sheets.");
  }
  if (!workbook.SheetNames.length) {
    throw new Error("Aucune feuille dans le classeur.");
  }
  const sheet = pickWorkbookSheet(workbook);
  const matrix = sheetToMatrix(sheet);
  const csv = catalogSheetMatrixToCsv(matrix);
  if (!csv.trim()) {
    throw new Error("Feuille sans données — vérifie l’onglet CATALOGUE.");
  }
  const score = scoreCatalogCsv(csv);
  if (score < 0) {
    throw new Error(
      "En-têtes catalogue introuvables — utilise les colonnes habituelles (SKU, Réf. modèle, Couleur…).",
    );
  }
  return csv;
}