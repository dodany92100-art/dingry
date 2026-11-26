import { describe, expect, it } from "vitest";
import {
  buildSku,
  colorLabelToSkuColorisCode,
  getModelRef,
  isValidSku,
  parseSku,
} from "@/lib/sku";

describe("parseSku / getModelRef", () => {
  it("FYM-PUL-FLU-BEI-M → modèle FYM-PUL-FLU", () => {
    const sku = "FYM-PUL-FLU-BEI-M";
    expect(isValidSku(sku)).toBe(true);
    expect(getModelRef(sku)).toBe("FYM-PUL-FLU");
    expect(parseSku(sku)).toMatchObject({
      marque: "FYM",
      type: "PUL",
      modele: "FLU",
      coloris: "BEI",
      taille: "M",
    });
  });

  it("FYM-TSH-BOU-NOI-L → modèle FYM-TSH-BOU", () => {
    const sku = "FYM-TSH-BOU-NOI-L";
    expect(getModelRef(sku)).toBe("FYM-TSH-BOU");
  });

  it("accepte la taille unique U", () => {
    expect(isValidSku("DIN-CAP-ESS-NOI-U")).toBe(true);
    expect(parseSku("DIN-CAP-ESS-NOI-U")?.taille).toBe("U");
  });

  it("rejette formats invalides", () => {
    expect(isValidSku("fym-pul-flu-bei-m")).toBe(false);
    expect(isValidSku("FYM PUL FLU BEI M")).toBe(false);
    expect(isValidSku("FYM-PUL-FLU-BEI")).toBe(false);
    expect(isValidSku("FYM-PUL-FLU-BEIGE-M")).toBe(false);
    expect(isValidSku("FYM-PUL-FLU-BEI-2XL")).toBe(false);
    expect(isValidSku("FYM-PUL-ÉLU-BEI-M")).toBe(false);
    expect(isValidSku("XXX-PUL-FLU-BEI-M")).toBe(false);
  });
});

describe("buildSku", () => {
  it("recompose le SKU canonique", () => {
    const sku = buildSku({
      marque: "FYM",
      type: "TSH",
      modele: "BOU",
      coloris: "NOI",
      taille: "L",
    });
    expect(sku).toBe("FYM-TSH-BOU-NOI-L");
    expect(getModelRef(sku)).toBe("FYM-TSH-BOU");
  });
});

describe("colorLabelToSkuColorisCode", () => {
  it("mappe les coloris catalogue étendus", () => {
    expect(colorLabelToSkuColorisCode("Vert")).toBe("VER");
    expect(colorLabelToSkuColorisCode("Chocolat")).toBe("CHO");
    expect(colorLabelToSkuColorisCode("Bleu roi")).toBe("BLE");
  });
});