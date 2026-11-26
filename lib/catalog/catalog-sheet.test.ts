import { describe, expect, it } from "vitest";
import {
  catalogSheetCrmCandidates,
  catalogDisplaySizeToSkuTaille,
  compactCatalogSheetHeaderKey,
  groupCatalogSheetByModelRef,
  normalizeCatalogSheetHeader,
  normalizeCatalogSheetSku,
  parseCatalogSheetCsv,
  parseCatalogSheetRow,
  parseCatalogSheetUnitPrice,
  skuTailleToCatalogDisplaySize,
  formatCatalogSheetIssueLine,
  type CatalogSheetRow,
} from "@/lib/catalog/catalog-sheet";

const CAP_NOIR: CatalogSheetRow = {
  brand: "FYMA",
  modelName: "Casquette brodée FYMA noire",
  sku: "FYM-CAP-BRO-NOI-U",
  modelRef: "FYM-CAP-BRO",
  unitPriceEuro: 40,
  category: "Caps",
  color: "Noir",
  size: "TU",
  gender: "Unisexe",
  shortDescription: "",
  longDescription: "",
  composition: "",
  highlights: "",
};

const PULL_M: CatalogSheetRow = {
  ...CAP_NOIR,
  modelName: "Pull maille fluffy brodé FYMA beige",
  sku: "FYM-PUL-FLU-BEI-M",
  modelRef: "FYM-PUL-FLU",
  unitPriceEuro: 120,
  category: "Crewnecks",
  color: "Beige",
  size: "M",
  longDescription: "Impossible de passer inaperçu dans ce pull.",
  composition: "100% Nylon",
  highlights: "Douceur et style",
};

describe("parseCatalogSheetUnitPrice", () => {
  it("normalise PrixU avec symbole €", () => {
    expect(parseCatalogSheetUnitPrice("40 €")).toBe(40);
    expect(parseCatalogSheetUnitPrice("120 €")).toBe(120);
    expect(parseCatalogSheetUnitPrice("35,50 €")).toBe(35.5);
    expect(parseCatalogSheetUnitPrice("35")).toBe(35);
    expect(parseCatalogSheetUnitPrice("60€")).toBe(60);
    expect(parseCatalogSheetUnitPrice("60.00€")).toBe(60);
    expect(parseCatalogSheetUnitPrice("59,9 €")).toBe(59.9);
    expect(parseCatalogSheetUnitPrice("60.00 EUR")).toBe(60);
    expect(parseCatalogSheetUnitPrice("1\u00a0200,50 €")).toBe(1200.5);
  });
});

describe("en-têtes tolérants", () => {
  it("reconnaît REF MODELE et prix alias", () => {
    expect(normalizeCatalogSheetHeader("REF. MODELE")).toBe("modelRef");
    expect(normalizeCatalogSheetHeader("Prix")).toBe("unitPrice");
    expect(compactCatalogSheetHeaderKey("  Réf.   Modèle ")).toBe("ref modele");
    expect(normalizeCatalogSheetHeader("nom_modele")).toBe("modelName");
  });
});

describe("normalisation SKU / tailles", () => {
  it("corrige SKU avec suffixe TU et tirets typographiques", () => {
    expect(normalizeCatalogSheetSku("fym–cap–bro–noi–tu")).toBe("FYM-CAP-BRO-NOI-U");
  });

  it("accepte tailles flexibles", () => {
    expect(catalogDisplaySizeToSkuTaille("T.U.")).toBe("U");
    expect(catalogDisplaySizeToSkuTaille("Taille unique")).toBe("U");
    expect(catalogDisplaySizeToSkuTaille("2xl")).toBe("XXL");
    expect(catalogDisplaySizeToSkuTaille("m")).toBe("M");
  });
});

describe("parseCatalogSheetRow (saisie imparfaite)", () => {
  it("déduit la réf. modèle et accepte marque / coloris / prix souples", () => {
    const { row, issues } = parseCatalogSheetRow({
      marque: "fyma",
      modelName: "Casquette",
      sku: "FYM-CAP-BRO-NOI-TU",
      modelRef: "",
      unitPrice: "60.00€",
      category: "caps",
      color: "noire",
      size: "tu",
    });
    expect(issues.filter((i) => i.level === "error")).toHaveLength(0);
    expect(row?.modelRef).toBe("FYM-CAP-BRO");
    expect(row?.sku).toBe("FYM-CAP-BRO-NOI-U");
    expect(row?.brand).toBe("FYMA");
    expect(row?.color).toBe("Noir");
    expect(row?.unitPriceEuro).toBe(60);
    expect(issues.some((i) => i.code === "model_ref_inferred")).toBe(true);
  });

  it("parse une ligne hoodie avec taille 2xl", () => {
    const { row, issues } = parseCatalogSheetRow({
      Marque: "DINGRY",
      "NOM MODÈLE": "Hoodie",
      SKU: "DIN-HOO-AAB-NOI-XXL",
      "Réf. Modèle": "DIN-HOO-AAB",
      PrixU: "60,00 €",
      Catégorie: "Hoodies",
      Coloris: "NOIR",
      Taille: "2xl",
    });
    expect(issues.filter((i) => i.level === "error")).toHaveLength(0);
    expect(row?.size).toBe("2XL");
  });
});

describe("parseCatalogSheetCsv", () => {
  it("ignore une ligne titre CATALOGUE", () => {
    const csv = `CATALOGUE
Marque;NOM MODÈLE;SKU;Réf. Modèle;PrixU;Catégorie;Coloris;Taille;Genre
fyma;Casquette;FYM-CAP-BRO-NOI-U;;40 €;Caps;noir;TU;Unisexe
`;
    const { rows, issues } = parseCatalogSheetCsv(csv);
    expect(issues.filter((i) => i.level === "error")).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.modelRef).toBe("FYM-CAP-BRO");
  });
});

describe("TU ↔ U", () => {
  it("mappe TU vers U pour le SKU", () => {
    expect(catalogDisplaySizeToSkuTaille("TU")).toBe("U");
    expect(skuTailleToCatalogDisplaySize("U")).toBe("TU");
  });
});

describe("diagnostics import", () => {
  it("erreur taille / SKU : ligne, champ, conseil", () => {
    const { issues } = parseCatalogSheetRow(
      {
        Marque: "FYMA",
        "NOM MODÈLE": "T-shirt test",
        SKU: "FYM-TSH-BAS-NOI-M",
        "Réf. Modèle": "FYM-TSH-BAS",
        PrixU: "35",
        Catégorie: "T-shirts",
        Coloris: "Noir",
        Taille: "L",
      },
      { sourceLine: 42 },
    );
    const err = issues.find((i) => i.code === "size_sku_mismatch");
    expect(err?.rowNumber).toBe(42);
    expect(err?.field).toBe("size");
    expect(err?.modelName).toBe("T-shirt test");
    expect(err?.fixHint).toMatch(/TU|U|SKU/i);
    expect(formatCatalogSheetIssueLine(err!)).toContain("Ligne 42");
    expect(formatCatalogSheetIssueLine(err!)).toContain("→");
  });
});

describe("parseCatalogSheetRow", () => {
  it("parse une ligne casquette FYMA", () => {
    const { row, issues } = parseCatalogSheetRow({
      Marque: "FYMA",
      "NOM MODÈLE": "Casquette brodée FYMA noire",
      SKU: "FYM-CAP-BRO-NOI-U",
      "Réf. Modèle": "FYM-CAP-BRO",
      PrixU: "40 €",
      Catégorie: "Caps",
      Coloris: "Noir",
      Taille: "TU",
      Genre: "Unisexe",
    });
    expect(issues.filter((i) => i.level === "error")).toHaveLength(0);
    expect(row?.sku).toBe("FYM-CAP-BRO-NOI-U");
    expect(row?.size).toBe("TU");
    expect(row?.unitPriceEuro).toBe(40);
  });

  it("rejette écart taille / SKU", () => {
    const { row } = parseCatalogSheetRow({
      Marque: "FYMA",
      "NOM MODÈLE": "T-shirt",
      SKU: "FYM-TSH-BAS-NOI-M",
      "Réf. Modèle": "FYM-TSH-BAS",
      PrixU: "35",
      Catégorie: "T-shirts",
      Coloris: "Noir",
      Taille: "L",
    });
    expect(row).toBeNull();
  });
});

describe("groupCatalogSheetByModelRef", () => {
  it("regroupe FYM-PUL-FLU", () => {
    const rows: CatalogSheetRow[] = [
      PULL_M,
      { ...PULL_M, sku: "FYM-PUL-FLU-BEI-L", size: "L" },
      { ...PULL_M, sku: "FYM-PUL-FLU-BEI-XL", size: "XL" },
    ];
    const groups = groupCatalogSheetByModelRef(rows);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.modelRef).toBe("FYM-PUL-FLU");
    expect(groups[0]!.rows).toHaveLength(3);
  });
});

describe("catalogSheetCrmCandidates", () => {
  it("fusionne les tailles d’un même coloris", () => {
    const rows: CatalogSheetRow[] = [
      PULL_M,
      { ...PULL_M, sku: "FYM-PUL-FLU-BEI-L", size: "L" },
    ];
    const { candidates } = catalogSheetCrmCandidates(rows);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]!.sizes).toEqual(expect.arrayContaining(["M", "L"]));
    expect(candidates[0]!.skuBySize.M).toBe("FYM-PUL-FLU-BEI-M");
    expect(candidates[0]!.skuBySize.L).toBe("FYM-PUL-FLU-BEI-L");
    expect(candidates[0]!.composition).toBe("100% Nylon");
  });
});