import { describe, expect, it } from "vitest";
import {
  buildDingryVariantSku,
  buildVariantAltText,
  dingryR2VariantFilename,
  dingryR2VariantObjectKey,
} from "@/lib/catalog/dingry-variant-naming";

describe("dingry variant naming", () => {
  it("SKU variante", () => {
    expect(buildDingryVariantSku("DINGRY-HOODIE-ESS", "RED")).toBe("DINGRY-HOODIE-ESS-RED");
  });

  it("fichier R2", () => {
    expect(dingryR2VariantFilename("Hoodie Essential", "Rouge")).toBe(
      "dingry-hoodie-essential-rouge.webp",
    );
  });

  it("clé objet R2", () => {
    expect(dingryR2VariantObjectKey("42", "Hoodie Essential", "Rouge")).toBe(
      "dingry/products/42/variants/dingry-hoodie-essential-rouge.webp",
    );
  });

  it("alt SEO", () => {
    expect(buildVariantAltText("Hoodie Essential", "Rouge")).toBe(
      "Hoodie Essential DINGRY couleur Rouge",
    );
  });
});
