import { describe, expect, it } from "vitest";
import { applyCatalogProductMakerPrefill, applyMakerTemplateToFormState } from "@/lib/admin/catalog-maker-prefill";
import { createNewProductFormState } from "@/lib/admin/smart-product-auto-attributes";
import type { AdminProduct } from "@/lib/admin/types";
import type { CatalogMakerTemplate } from "@/lib/validations/catalog-maker-template";

describe("catalog-maker-prefill", () => {
  it("conserve le prix et les tailles du modèle maker malgré les défauts catégorie", () => {
    const prev = createNewProductFormState("T-shirts", []);
    const template: CatalogMakerTemplate = {
      id: "maker-hoodie",
      label: "HOODIE",
      category: "Hoodies",
      priceTtc: 80,
      priceHt: 66.67,
      sizes: ["S", "M", "L", "XL"],
      sizeGuide: "400 g/m²",
      createdAt: "",
      updatedAt: "",
    };
    const next = applyMakerTemplateToFormState(prev, template, {
      editingId: null,
      existingSkus: [],
    });
    expect(next.category).toBe("Hoodies");
    expect(next.price).toBe("80");
    expect(next.sizes).toEqual(["S", "M", "L", "XL"]);
    expect(next.sizeGuide).toContain("400");
  });

  it("reprend la fiche CRM catalogue (replace)", () => {
    const prev = createNewProductFormState("T-shirts", []);
    const source = {
      id: "42",
      sku: "DINGRY-TEE-01",
      name: "T-SHIRT SIGNATURE / WHITE",
      variant: "BLANC — RECTO",
      category: "T-shirts",
      price: 35,
      sizes: ["S", "M", "L"],
      stock: 10,
      publishStatus: "live",
      colorDeclinations: ["BLANC"],
      description: "Coton bio",
      materials: "100% coton",
      sizeGuide: "180 g/m²",
      fabrication: "Fab France",
      limitedEdition: "",
      printPlacement: "RECTO_ONLY",
      imageUrl: "",
      blobUrl: null,
      blobPathname: null,
      imageBackUrl: "",
      imageBackBlobUrl: null,
      imageBackBlobPathname: null,
      createdAt: "",
      isPinned: false,
      displayOrder: 0,
    } satisfies AdminProduct;
    const next = applyCatalogProductMakerPrefill(prev, source, {
      editingId: null,
      existingSkus: [],
    });
    expect(next.name).toBe(source.name);
    expect(next.variant).toBe(source.variant);
    expect(next.price).toBe("35");
    expect(next.sizes).toEqual(["S", "M", "L"]);
    expect(next.colorDeclinations).toEqual(["BLANC"]);
    expect(next.description).toBe("Coton bio");
    expect(next.stock).toBe("10");
  });
});