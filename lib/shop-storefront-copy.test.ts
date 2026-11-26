import { describe, expect, it } from "vitest";
import { CATALOG_FILTER_LABEL } from "@/lib/catalog-category";
import { mergeShopStorefrontCopyPatch, normalizeShopStorefrontCopy, STOREFRONT_COPY_LIMITS } from "@/lib/shop-storefront-copy";

describe("shop-storefront-copy", () => {
  it("tronque les libellés catalogue", () => {
    const next = normalizeShopStorefrontCopy({
      catalog: { hoodies: "x".repeat(40) },
    });
    expect(next.catalog.hoodies?.length).toBeLessThanOrEqual(STOREFRONT_COPY_LIMITS.catalogLabel);
  });

  it("fusionne un patch catalogue", () => {
    const base = normalizeShopStorefrontCopy(null);
    const merged = mergeShopStorefrontCopyPatch(base, {
      catalog: { all: "Capsule", hoodies: "Hoodie luxe" },
    });
    expect(merged.catalog.all).toBe("Capsule");
    expect(merged.catalog.hoodies).toBe("Hoodie luxe");
    expect(merged.catalog["t-shirts"]).toBeUndefined();
  });

  it("conserve les défauts heritage", () => {
    const next = normalizeShopStorefrontCopy(null);
    expect(next.heritagePreview.titleLine1.length).toBeGreaterThan(3);
    expect(next.heritageDetails.philosophy.title.length).toBeGreaterThan(3);
    expect(next.heritageDetails.founder.imageUrl.length).toBeGreaterThan(1);
    expect(next.footer.manifesto).toContain("ATTITUDE");
    expect(CATALOG_FILTER_LABEL.all).toBe("Collection");
  });
});