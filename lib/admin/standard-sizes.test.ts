import { describe, expect, it } from "vitest";
import {
  adminBulkSelectSizesForCategory,
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

const HOODIE_GRID_WITHOUT_TU = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
] as const;

describe("adminBulkSelectSizesForCategory", () => {
  it("hoodie : grille complète sans TU", () => {
    expect(adminBulkSelectSizesForCategory("Hoodies")).toEqual([...HOODIE_GRID_WITHOUT_TU]);
    expect(adminBulkSelectSizesForCategory("Hoodies")).not.toContain("TU");
  });
});

describe("defaultSelectedSizesForCategory", () => {
  it("pré-coche toute la grille hoodie sauf TU", () => {
    expect(defaultSelectedSizesForCategory("Hoodies")).toEqual([...HOODIE_GRID_WITHOUT_TU]);
  });

  it("crop top : toute la grille (pas de TU)", () => {
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
