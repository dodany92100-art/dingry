import { describe, expect, it } from "vitest";
import { buildVariantSku, normalizeOptionKey, shopOptionsFromColorDeclinations } from "@/lib/catalog/product-options";

describe("buildVariantSku", () => {
  it("combine parent + couleur", () => {
    expect(
      buildVariantSku("DGRY-TS-01", { optionKey: "ROUGE", skuSuffix: "ROUGE" }),
    ).toBe("DGRY-TS-01-ROUGE");
  });
});

describe("normalizeOptionKey", () => {
  it("majuscules", () => {
    expect(normalizeOptionKey("  king blue ")).toBe("KING BLUE");
  });
});

describe("shopOptionsFromColorDeclinations", () => {
  it("déduit défaut depuis variant", () => {
    const opts = shopOptionsFromColorDeclinations(["NOIR", "ROUGE"], "NOIR", {
      parentSku: "DINGRY-HOODIE-ESS",
      productName: "Hoodie Essential",
    });
    expect(opts.map((o) => o.optionKey)).toEqual(["NOIR", "ROUGE"]);
    expect(opts.find((o) => o.isDefault)?.optionKey).toBe("NOIR");
    expect(opts.find((o) => o.optionKey === "ROUGE")?.variantSku).toBe("DINGRY-HOODIE-ESS-RED");
    expect(opts.find((o) => o.optionKey === "NOIR")?.variantSku).toBe("DINGRY-HOODIE-ESS-BLK");
    expect(opts[0]?.altText).toContain("DINGRY");
  });
});
