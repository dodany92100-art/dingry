import { describe, expect, it } from "vitest";
import {
  parseProductFamilyAndPrice,
  suggestedPriceLabelForCategory,
} from "@/lib/admin/parse-product-family";

describe("parseProductFamilyAndPrice", () => {
  it("détecte T-shirt et prix 45 €", () => {
    const r = parseProductFamilyAndPrice("T-shirt logo DINGRY · street");
    expect(r.category).toBe("T-shirts");
    expect(r.suggestedPrice).toBe(45);
    expect(r.familyLabel).toBe("T-shirt");
  });

  it("détecte Hoodie et prix 90 €", () => {
    const r = parseProductFamilyAndPrice("HOODIE DINGRY SIGNATURE\nNoir");
    expect(r.category).toBe("Hoodies");
    expect(r.suggestedPrice).toBe(90);
  });

  it("détecte pantalon cargo et prix 110 €", () => {
    const r = parseProductFamilyAndPrice("PANTALON CARGO DINGRY — coupe wide");
    expect(r.category).toBe("Pants");
    expect(r.suggestedPrice).toBe(110);
    expect(r.familyLabel).toBe("Pantalon cargo");
  });

  it("détecte casquette", () => {
    const r = parseProductFamilyAndPrice("CASQUETTE SNAPBACK");
    expect(r.category).toBe("Caps");
    expect(r.suggestedPriceLabel).toBe("35");
  });
});

describe("suggestedPriceLabelForCategory", () => {
  it("formate un entier", () => {
    expect(suggestedPriceLabelForCategory("Hoodies")).toBe("90");
  });
});
