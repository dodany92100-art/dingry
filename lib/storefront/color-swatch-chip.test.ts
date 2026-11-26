import { describe, expect, it } from "vitest";
import {
  colorSwatchPdpStyle,
  swatchHexForColorLabel,
} from "@/lib/storefront/color-swatch-chip";

describe("swatchHexForColorLabel", () => {
  it("résout KING BLUE / PINK sur le bleu roi", () => {
    expect(swatchHexForColorLabel("KING BLUE / PINK").toLowerCase()).toBe("#1e3a8a");
  });

  it("résout les libellés simples", () => {
    expect(swatchHexForColorLabel("NOIR").toLowerCase()).toBe("#0c0c0c");
    expect(swatchHexForColorLabel("GRIS CHINÉ").toLowerCase()).toBe("#a1a1aa");
  });

  it("filet or fin uniquement sur BLACK (pas bleu ni chocolat)", () => {
    const noir = colorSwatchPdpStyle("BLACK");
    const bleu = colorSwatchPdpStyle("KING BLUE / PINK");
    const choco = colorSwatchPdpStyle("CHOCOLAT");
    const vert = colorSwatchPdpStyle("VERT");
    expect(String(noir.border)).toBe("1px solid transparent");
    expect(String(bleu.border)).toBe("1px solid transparent");
    expect(String(choco.border)).toBe("1px solid transparent");
    expect(String(vert.border)).toBe("1px solid transparent");
  });
});