import { describe, expect, it } from "vitest";
import {
  defaultSelectedSizesForCategory,
  filterStandardLetterSizes,
  normalizeToStandardLetterSize,
} from "@/lib/admin/standard-sizes";

describe("filterStandardLetterSizes", () => {
  it("garde S–XXL et ignore le reste", () => {
    expect(filterStandardLetterSizes(["XS", "S", "M", "L", "XL", "2XL", "3XL", "5XL", "TU"])).toEqual([
      "S",
      "M",
      "L",
      "XL",
      "2XL",
    ]);
  });

  it("normalise XXL en 2XL", () => {
    expect(filterStandardLetterSizes(["M", "XXL"])).toEqual(["M", "2XL"]);
  });
});

describe("defaultSelectedSizesForCategory", () => {
  it("pré-coche S–2XL sur hoodie", () => {
    expect(defaultSelectedSizesForCategory("Hoodies")).toEqual(["S", "M", "L", "XL", "2XL"]);
  });

  it("pré-coche S–2XL sur crop top", () => {
    expect(defaultSelectedSizesForCategory("Crop tops")).toEqual(["S", "M", "L", "XL", "2XL"]);
  });

  it("pantalon : aucun tour par défaut", () => {
    expect(defaultSelectedSizesForCategory("Pants")).toEqual([]);
  });
});

describe("normalizeToStandardLetterSize", () => {
  it("rejette hors grille", () => {
    expect(normalizeToStandardLetterSize("4XL")).toBeNull();
  });
});
