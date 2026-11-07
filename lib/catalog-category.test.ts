import { describe, expect, it } from "vitest";
import { normalizeCatalogCategory } from "@/lib/catalog-category";
import { normalizeProductCategory } from "@/lib/admin/types";
import { buildCatalogMenuSections, resolveShopCategory } from "@/lib/shop-catalog";
import type { ShopProduct } from "@/lib/catalog";

describe("catalog pants", () => {
  it("normalise Pant / Pantalon vers le slug pants", () => {
    expect(normalizeCatalogCategory("Pant")).toBe("pants");
    expect(normalizeCatalogCategory("Pantalons")).toBe("pants");
    expect(normalizeCatalogCategory("Pants")).toBe("pants");
  });

  it("normalise les fiches CRM Pant → Pants", () => {
    expect(normalizeProductCategory("Pant")).toBe("Pants");
    expect(normalizeProductCategory("Pantalon")).toBe("Pants");
  });

  it("resolveShopCategory mappe vers Pants", () => {
    expect(resolveShopCategory(99, "Pant")).toBe("Pants");
    expect(resolveShopCategory(99, "Pants")).toBe("Pants");
  });

  it("inclut Pants et Crop tops dans Collection même vide", () => {
    const sections = buildCatalogMenuSections([]);
    expect(sections.some((s) => s.category === "pants")).toBe(true);
    expect(sections.some((s) => s.category === "crop-top")).toBe(true);
  });

  it("normalise Crop Top vers crop-top", () => {
    expect(normalizeCatalogCategory("Crop Top")).toBe("crop-top");
    expect(normalizeCatalogCategory("croptop")).toBe("crop-top");
    expect(normalizeProductCategory("Crop Top")).toBe("Crop tops");
  });

  it("classe un pantalon live dans le bloc Pants", () => {
    const product: ShopProduct = {
      id: 201,
      name: "CARGO",
      variant: "32",
      price: 129,
      image: "https://example.com/p.webp",
      description: "",
      category: "Pants",
    };
    const sections = buildCatalogMenuSections([product]);
    const pants = sections.find((s) => s.category === "pants");
    expect(pants?.products).toHaveLength(1);
    expect(pants?.products[0]?.id).toBe(201);
  });
});
