import { describe, expect, it } from "vitest";
import { ADMIN_COLOR_PRESETS_CANONICAL } from "@/lib/admin/product-variant-presets";
import { VARIANT_SWATCH_HEX } from "@/lib/admin/smart-crm";
import {
  buildColorDeclinationBackendFields,
  buildCustomColorDeclination,
  DINGRY_COLOR_PRESETS,
  canonicalColorDeclinationValue,
  colorDeclinationsCanonicallyEqual,
  frenchLabelForColorPreset,
  techCodeForColorPreset,
} from "@/lib/admin/dingry-color-palette";

describe("dingry-color-palette", () => {
  it("pastilles CRM = palette canonique (sans doublons)", () => {
    expect(DINGRY_COLOR_PRESETS.map((p) => p.presetKey)).toEqual([...ADMIN_COLOR_PRESETS_CANONICAL]);
  });

  it("hex issus de VARIANT_SWATCH_HEX (pas de couleur hors catalogue)", () => {
    for (const row of DINGRY_COLOR_PRESETS) {
      expect(VARIANT_SWATCH_HEX[row.presetKey] ?? row.hex).toBeTruthy();
    }
  });

  it("génère variant_sku, R2 et alt pour ROUGE", () => {
    const meta = buildColorDeclinationBackendFields({
      productId: "31",
      productName: "Hoodie Essential",
      parentSku: "DINGRY-HOODIE-ESS",
      colorLabel: "ROUGE",
    });
    expect(meta.optionKey).toBe("ROUGE");
    expect(meta.variantSku).toBe("DINGRY-HOODIE-ESS-RED");
    expect(meta.imageBlobPathname).toContain("dingry/products/31/variants/");
    expect(meta.altText).toMatch(/couleur Rouge/i);
  });

  it("libellés français pour NOIR et PINK", () => {
    expect(frenchLabelForColorPreset("NOIR")).toBe("Noir");
    expect(frenchLabelForColorPreset("PINK")).toBe("Rose");
  });

  it("BLACK alias → stockage NOIR", () => {
    expect(canonicalColorDeclinationValue("BLACK")).toBe("NOIR");
    expect(colorDeclinationsCanonicallyEqual("black", "NOIR")).toBe(true);
  });

  it("abréviations officielles (affichage CRM + SKU)", () => {
    expect(techCodeForColorPreset("NOIR")).toBe("BLK");
    expect(techCodeForColorPreset("BLANC")).toBe("WHT");
    expect(techCodeForColorPreset("ROYAL BLUE")).toBe("ROY");
    expect(techCodeForColorPreset("GRIS CHINÉ")).toBe("HGY");
    expect(techCodeForColorPreset("PINK")).toBe("PNK");
    expect(techCodeForColorPreset("ORANGE")).toBe("ORG");
  });

  it("couleur personnalisée nommée (roue chromatique)", () => {
    const decl = buildCustomColorDeclination("Corail", "#ea580c")!;
    expect(canonicalColorDeclinationValue(decl)).toBe("Corail · #EA580C");
    expect(colorDeclinationsCanonicallyEqual(decl, "corail · #ea580c")).toBe(true);
    expect(frenchLabelForColorPreset(decl)).toBe("Corail");
    expect(techCodeForColorPreset(decl)).toBe("CORA");
  });
});
