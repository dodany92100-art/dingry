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

  it("priorise la catégorie CRM sur l’id tee historique", () => {
    expect(resolveShopCategory(24, "Hoodies")).toBe("Hoodie");
    expect(resolveShopCategory(24, "T-shirts")).toBe("T-shirts");
  });

  it("affiche toutes les familles du menu, y compris sans fiche", () => {
    const sections = buildCatalogMenuSections([]);
    const pants = sections.find((s) => s.category === "pants");
    const crop = sections.find((s) => s.category === "crop-top");
    expect(pants).toBeDefined();
    expect(crop).toBeDefined();
    expect(pants?.products).toHaveLength(0);
    expect(crop?.products).toHaveLength(0);
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
