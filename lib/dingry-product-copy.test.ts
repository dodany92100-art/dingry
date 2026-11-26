import { describe, expect, it } from "vitest";
import { productSlugForCatalogId } from "@/lib/dingry-product-copy";
import { DINGRY_HOODIE_BLACK_ORIGINAL_ID, DINGRY_HOODIE_BLACK_PARIS_ID } from "@/lib/shop-catalog";

describe("productSlugForCatalogId", () => {
  it("partage le slug noir entre legacy #6 et Paris #25", () => {
    const slug = "hoodie-dingry-original-black";
    expect(productSlugForCatalogId(DINGRY_HOODIE_BLACK_ORIGINAL_ID)).toBe(slug);
    expect(productSlugForCatalogId(DINGRY_HOODIE_BLACK_PARIS_ID)).toBe(slug);
  });
});