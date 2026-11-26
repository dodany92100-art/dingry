import { describe, expect, it } from "vitest";
import { prepareCatalogSheetOnClient } from "@/lib/admin/catalog-sheet-import-client";

const CSV_HEADER =
  "Marque;NOM MODÈLE;SKU;Réf. Modèle;PrixU;Catégorie;Coloris;Taille;Genre\n";

describe("prepareCatalogSheetOnClient", () => {
  it("valide un CSV sans réseau", () => {
    const prepared = prepareCatalogSheetOnClient({
      kind: "csv",
      csvText: `${CSV_HEADER}FYMA;Casquette;FYM-CAP-BRO-NOI-U;FYM-CAP-BRO;40 €;Caps;Noir;TU;Unisexe\n`,
    });
    expect(prepared.ok).toBe(true);
    if (prepared.ok) {
      expect(prepared.candidates).toHaveLength(1);
      expect(prepared.rowCount).toBe(1);
    }
  });

  it("bloque localement un CSV avec erreurs (0 requête serveur côté UI)", () => {
    const prepared = prepareCatalogSheetOnClient({
      kind: "csv",
      csvText: `${CSV_HEADER}FYMA;T-shirt;FYM-TSH-BAS-NOI-M;FYM-TSH-BAS;GRATUIT;T-shirts;Noir;M;Unisexe\n`,
    });
    expect(prepared.ok).toBe(false);
    if (!prepared.ok) {
      expect(prepared.summary.errorCount).toBeGreaterThan(0);
    }
  });
});