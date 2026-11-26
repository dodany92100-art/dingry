import { describe, expect, it } from "vitest";
import {
  clampAtelierHeroHarborShift,
  normalizeAtelierHeroHarborShift,
} from "@/lib/atelier-hero-harbor-shift";

describe("clampAtelierHeroHarborShift", () => {
  it("0 reste 0", () => {
    expect(clampAtelierHeroHarborShift(0)).toBe(0);
  });

  it("borne les extrêmes", () => {
    expect(clampAtelierHeroHarborShift(2000)).toBe(800);
    expect(clampAtelierHeroHarborShift(-1200)).toBe(-800);
  });
});

describe("normalizeAtelierHeroHarborShift", () => {
  it("ignore NaN et garde les valeurs valides", () => {
    expect(
      normalizeAtelierHeroHarborShift({
        logoX: 12,
        logoY: Number.NaN,
        ctaX: "x",
        ctaY: -44,
      }),
    ).toEqual({ logoX: 12, logoY: 0, ctaX: 0, ctaY: -44 });
  });
});