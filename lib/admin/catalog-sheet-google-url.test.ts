import { describe, expect, it } from "vitest";
import { googleSheetXlsxExportUrl, parseGoogleSpreadsheetUrl } from "@/lib/admin/catalog-sheet-google-url";

describe("catalog-sheet-google-url", () => {
  it("parse lien édition", () => {
    const parsed = parseGoogleSpreadsheetUrl(
      "https://docs.google.com/spreadsheets/d/abc123XYZ/edit#gid=42",
    );
    expect(parsed).toEqual({ spreadsheetId: "abc123XYZ", gid: "42" });
  });

  it("parse lien partage ouverture", () => {
    const parsed = parseGoogleSpreadsheetUrl(
      "https://docs.google.com/spreadsheets/d/abc123XYZ/edit?usp=sharing",
    );
    expect(parsed?.spreadsheetId).toBe("abc123XYZ");
  });

  it("export URL", () => {
    expect(googleSheetXlsxExportUrl("id1", null)).toContain("id1");
    expect(googleSheetXlsxExportUrl("id1", "9")).toContain("gid=9");
  });
});