import { describe, expect, it } from "vitest";
import {
  catalogMakerTemplateOptionLabel,
  materializeCatalogMakerTemplate,
  validateCatalogMakerTemplate,
} from "@/lib/validations/catalog-maker-template";

describe("validateCatalogMakerTemplate", () => {
  const hoodie = materializeCatalogMakerTemplate(
    {
      label: "HOODIE",
      category: "Hoodies",
      priceTtc: 50,
      sizes: ["S", "M", "L"],
      sizeGuide: "400 g/m²",
    },
    "hoodie",
    "2026-01-01T00:00:00.000Z",
  );

  it("accepte un nouveau modèle", () => {
    const r = validateCatalogMakerTemplate(
      { label: "tee-shirt", category: "T-shirts", priceTtc: 45, sizes: ["M"] },
      [hoodie],
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.label).toBe("TEE-SHIRT");
  });

  it("affiche grammage dans le libellé liste", () => {
    expect(catalogMakerTemplateOptionLabel(hoodie)).toContain("400 g/m²");
  });

  it("rejette doublon de template", () => {
    const r = validateCatalogMakerTemplate(
      { label: "  hoodie ", category: "Hoodies", priceTtc: 60, sizes: ["S"] },
      [hoodie],
    );
    expect(r.ok).toBe(false);
  });

  it("rejette un modèle identique avec un autre libellé", () => {
    const r = validateCatalogMakerTemplate(
      {
        label: "SWEAT",
        category: "Hoodies",
        priceTtc: 50,
        sizes: ["L", "S", "M"],
        sizeGuide: "400 g/m²",
      },
      [hoodie],
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("identique");
  });
});
