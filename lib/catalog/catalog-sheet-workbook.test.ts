import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
  catalogSheetCsvFromWorkbookBuffer,
  catalogSheetMatrixToCsv,
  isCatalogSpreadsheetFileName,
} from "@/lib/catalog/catalog-sheet-workbook";
import { parseCatalogSheetCsv } from "@/lib/catalog/catalog-sheet";

describe("catalog-sheet-workbook", () => {
  it("isCatalogSpreadsheetFileName", () => {
    expect(isCatalogSpreadsheetFileName("fyma.xlsx")).toBe(true);
    expect(isCatalogSpreadsheetFileName("fyma.csv")).toBe(false);
  });

  it("matrix → CSV → parse", () => {
    const csv = catalogSheetMatrixToCsv([
      ["Marque", "NOM MODÈLE", "SKU", "Réf. Modèle", "PrixU", "Catégorie", "Coloris", "Taille", "Genre"],
      ["fyma", "Jersey", "FYM-JER-BAS-BLA-M", "FYM-JER-BAS", "60 €", "Jerseys", "blanc", "M", "Unisexe"],
    ]);
    const parsed = parseCatalogSheetCsv(csv);
    expect(parsed.rows.length).toBe(1);
    expect(parsed.rows[0]?.sku).toBe("FYM-JER-BAS-BLA-M");
  });

  it("lit un buffer .xlsx", () => {
    const wb = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ["Marque", "NOM MODÈLE", "SKU", "Réf. Modèle", "PrixU", "Catégorie", "Coloris", "Taille", "Genre"],
      ["fyma", "Jersey", "FYM-JER-BAS-BLA-M", "FYM-JER-BAS", "60 €", "Jerseys", "blanc", "M", "Unisexe"],
    ]);
    XLSX.utils.book_append_sheet(wb, sheet, "CATALOGUE");
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    const csv = catalogSheetCsvFromWorkbookBuffer(buffer);
    const parsed = parseCatalogSheetCsv(csv);
    expect(parsed.rows.length).toBe(1);
  });
});