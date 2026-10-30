import { describe, expect, it } from "vitest";
import {
  LEGACY_HOODIE_VERSO_TO_RECTO,
  resolveRectoCatalogId,
  versoSkuFromRecto,
  VERSO_TO_RECTO_CATALOG_ID,
} from "@/lib/catalog-verso-recto";

describe("VERSO_TO_RECTO_CATALOG_ID", () => {
  it("mappe les hoodies legacy", () => {
    expect(VERSO_TO_RECTO_CATALOG_ID.get(8)).toBe(6);
    expect(VERSO_TO_RECTO_CATALOG_ID.get(1)).toBe(2);
  });

  it("mappe les tees verso orphelins vers le recto CRM précédent", () => {
    expect(VERSO_TO_RECTO_CATALOG_ID.get(12)).toBe(11);
    expect(VERSO_TO_RECTO_CATALOG_ID.get(18)).toBe(17);
    expect(VERSO_TO_RECTO_CATALOG_ID.get(20)).toBe(19);
  });

  it("mappe les sweats verso", () => {
    expect(VERSO_TO_RECTO_CATALOG_ID.get(40)).toBe(39);
  });
});

describe("resolveRectoCatalogId", () => {
  it("laisse les ids recto inchangés", () => {
    expect(resolveRectoCatalogId(39)).toBe(39);
    expect(resolveRectoCatalogId(99)).toBe(99);
  });
});

describe("versoSkuFromRecto", () => {
  it("ajoute le suffixe -V", () => {
    expect(versoSkuFromRecto("DINGRY-H04")).toBe("DINGRY-H04-V");
    expect(versoSkuFromRecto("DINGRY-S03-V")).toBe("DINGRY-S03-V");
  });
});

describe("LEGACY_HOODIE_VERSO_TO_RECTO", () => {
  it("couvre les ids VITRINE_ONLY hoodie", () => {
    for (const versoId of [1, 3, 5, 8]) {
      expect(LEGACY_HOODIE_VERSO_TO_RECTO[versoId]).toBeGreaterThan(0);
    }
  });
});
