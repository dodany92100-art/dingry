import { describe, expect, it } from "vitest";
import { colorAbbrevFromDeclinationLabel } from "@/lib/catalog/dingry-color-abbrev";

describe("dingry-color-abbrev", () => {
  it("mappe tous les presets admin", () => {
    expect(colorAbbrevFromDeclinationLabel("NOIR")).toBe("BLK");
    expect(colorAbbrevFromDeclinationLabel("BLACK")).toBe("BLK");
    expect(colorAbbrevFromDeclinationLabel("ZENITH")).toBe("ZTH");
    expect(colorAbbrevFromDeclinationLabel("JAUNE FLUO")).toBe("YLW");
  });

  it("n’utilise que des lettres majuscules (3–4)", () => {
    for (const label of ["VERT", "CHOCOLAT", "BLEU ROI"] as const) {
      const code = colorAbbrevFromDeclinationLabel(label);
      expect(code).toMatch(/^[A-Z]{3,4}$/);
    }
  });
});
