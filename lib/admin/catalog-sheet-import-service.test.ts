import { describe, expect, it } from "vitest";
import { prepareCatalogSheetImport } from "@/lib/admin/catalog-sheet-import-service";

const CSV_HEADER =
  "Marque;NOM MODÈLE;SKU;Réf. Modèle;PrixU;Catégorie;Coloris;Taille;Genre\n";

describe("prepareCatalogSheetImport", () => {
  it("parse un CSV admin (séparateur ;)", () => {
    const csv = `${CSV_HEADER}FYMA;Casquette;FYM-CAP-BRO-NOI-U;FYM-CAP-BRO;40 €;Caps;Noir;TU;Unisexe\n`;
    const result = prepareCatalogSheetImport({ csvText: csv });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.rows).toHaveLength(1);
      expect(result.data.rows[0]?.sku).toBe("FYM-CAP-BRO-NOI-U");
    }
  });

  it("rejette un CSV vide", () => {
    const result = prepareCatalogSheetImport({ csvText: "Marque;SKU\n" });
    expect(result.ok).toBe(false);
  });

  it("expose des candidates prêtes pour le wire client", () => {
    const csv = `${CSV_HEADER}FYMA;Casquette;FYM-CAP-BRO-NOI-U;FYM-CAP-BRO;40 €;Caps;Noir;TU;Unisexe\n`;
    const result = prepareCatalogSheetImport({ csvText: csv });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.candidates?.length).toBe(1);
    }
  });
});