import { describe, expect, it } from "vitest";
import { clampFooterColumnShift, normalizeFooterColumnShift } from "./footer-column-shift";

describe("footer column shift", () => {
  it("laisse 0 au centre", () => {
    expect(clampFooterColumnShift(0)).toBe(0);
  });

  it("borne le décalage", () => {
    expect(clampFooterColumnShift(999)).toBe(240);
    expect(clampFooterColumnShift(-2000)).toBe(-1400);
  });

  it("ignore une valeur illisible", () => {
    expect(normalizeFooterColumnShift({ marque: Number.NaN, boutique: "12", legal: 8 })).toEqual({
      marque: 0,
      boutique: 0,
      legal: 8,
      logo: 0,
      instagram: 0,
    });
  });
});
