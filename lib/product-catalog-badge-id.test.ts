import { describe, expect, it } from "vitest";
import { productCatalogBadgeId } from "@/lib/product-catalog-badge-id";

describe("productCatalogBadgeId", () => {
  it("conserve l’id catalogue tel quel", () => {
    expect(productCatalogBadgeId(25)).toBe("25");
    expect(productCatalogBadgeId("4")).toBe("4");
  });

  it("ne dérive pas un id recto", () => {
    expect(productCatalogBadgeId(26)).toBe("26");
  });
});
