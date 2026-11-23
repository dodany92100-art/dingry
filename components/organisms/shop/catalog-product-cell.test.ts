import { describe, expect, it } from "vitest";
import { catalogProductImagePriority } from "@/components/organisms/shop/catalog-product-cell";

describe("catalogProductImagePriority", () => {
  it("ne marque jamais une carte en priority (LCP = hero)", () => {
    expect(catalogProductImagePriority(0)).toBe(false);
    expect(catalogProductImagePriority(12)).toBe(false);
  });
});