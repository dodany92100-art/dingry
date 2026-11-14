import { describe, expect, it } from "vitest";
import { colorAbbrevFromDeclinationLabel } from "@/lib/catalog/dingry-color-abbrev";
import {
  abbrevSourceFromColorDeclination,
  buildCustomColorDeclination,
  canonicalCustomColorDeclination,
  displayLabelFromColorDeclination,
  hexFromColorDeclination,
  parseCustomColorDeclination,
} from "@/lib/catalog/dingry-color-custom";
import { shopOptionsFromColorDeclinations } from "@/lib/catalog/product-options";

describe("dingry-color-custom", () => {
  it("construit et parse Nom · #HEX", () => {
    const built = buildCustomColorDeclination("Corail", "#ea580c");
    expect(built).toBe("Corail · #EA580C");
    expect(parseCustomColorDeclination(built!)).toEqual({ name: "Corail", hex: "#EA580C" });
    expect(hexFromColorDeclination(built!)).toBe("#EA580C");
    expect(displayLabelFromColorDeclination(built!)).toBe("Corail");
    expect(abbrevSourceFromColorDeclination(built!)).toBe("Corail");
    expect(canonicalCustomColorDeclination("corail · #ea580c")).toBe("corail · #EA580C");
  });

  it("SKU et libellé boutique utilisent le nom", () => {
    const decl = buildCustomColorDeclination("Sunset", "#FF6B4A")!;
    expect(colorAbbrevFromDeclinationLabel(decl)).toMatch(/^[A-Z]{3,4}$/);
    const opts = shopOptionsFromColorDeclinations([decl], decl, {
      parentSku: "DGRY-TS-01",
      productName: "Tee",
    });
    expect(opts[0]?.label).toBe("SUNSET");
    expect(opts[0]?.optionKey).toBe("SUNSET");
  });
});