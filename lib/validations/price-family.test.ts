import { describe, expect, it } from "vitest";
import {
  buildPriceFamilyCanonicalId,
  materializePriceFamily,
  normalizeCrmProductNameField,
  priceFamilyDraftFromProductFields,
  validatePriceFamilyDraft,
  type PriceFamily,
} from "@/lib/validations/price-family";

describe("normalizeCrmProductNameField", () => {
  it("trim, espaces doubles, majuscules (nom produit seul)", () => {
    expect(normalizeCrmProductNameField("  hoodie  chocolat ")).toBe("HOODIE CHOCOLAT");
  });
});

describe("validatePriceFamilyDraft", () => {
  const baseFamily: PriceFamily = materializePriceFamily(
    {
      displayName: "Hoodie Chocolat",
      category: "Hoodies",
      modelName: "Hoodie Chocolat",
      color: "",
      priceTtc: 90,
      sizes: ["S", "M", "L", "XL"],
    },
    buildPriceFamilyCanonicalId({
      category: "Hoodies",
      modelName: "Hoodie Chocolat",
      color: "",
    }),
    "2026-01-01T00:00:00.000Z",
  );

  it("accepte une nouvelle famille", () => {
    const draft = priceFamilyDraftFromProductFields({
      name: "Tee Mint",
      category: "T-shirts",
      variant: "MINT",
      price: 45,
      sizes: ["S", "M", "L"],
    });
    const r = validatePriceFamilyDraft(draft, [baseFamily]);
    expect(r.ok).toBe(true);
  });

  it("rejette un doublon insensible à la casse / espaces", () => {
    const draft = priceFamilyDraftFromProductFields({
      name: "  hoodie   chocolat ",
      category: "Hoodies",
      variant: "",
      price: 90,
      sizes: ["M"],
    });
    const r = validatePriceFamilyDraft(draft, [baseFamily]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("Hoodie Chocolat");
  });
});
