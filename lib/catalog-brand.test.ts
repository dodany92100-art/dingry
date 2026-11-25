import { describe, expect, it } from "vitest";
import { filterByBrand, parseCatalogBrandFilter } from "@/lib/catalog-brand";
import { filterCatalogProducts } from "@/lib/shop-catalog";
import type { ShopProduct } from "@/lib/catalog";

function product(partial: Partial<ShopProduct> & Pick<ShopProduct, "id">): ShopProduct {
  const { id, ...rest } = partial;
  return {
    name: "Test",
    variant: "",
    price: 50,
    image: "https://example.com/a.webp",
    description: "",
    category: "Hoodie",
    brand: "DINGRY",
    collection: "Signature",
    ...rest,
    id,
  };
}

describe("parseCatalogBrandFilter", () => {
  it("retourne null si absent ou vide", () => {
    expect(parseCatalogBrandFilter(null)).toBeNull();
    expect(parseCatalogBrandFilter("")).toBeNull();
    expect(parseCatalogBrandFilter(undefined)).toBeNull();
  });

  it("accepte une marque valide", () => {
    expect(parseCatalogBrandFilter("DINGRY")).toBe("DINGRY");
    expect(parseCatalogBrandFilter("FYMA")).toBe("FYMA");
  });

  it("décode ROCK+THE+STREET", () => {
    expect(parseCatalogBrandFilter("ROCK+THE+STREET")).toBe("ROCK THE STREET");
    expect(parseCatalogBrandFilter("ROCK%20THE%20STREET")).toBe("ROCK THE STREET");
  });

  it("ignore une marque inconnue → Voir tous", () => {
    expect(parseCatalogBrandFilter("ACME")).toBeNull();
    expect(parseCatalogBrandFilter("dingry")).toBeNull();
  });
});

describe("filterByBrand", () => {
  const catalog = [
    product({ id: 201, brand: "DINGRY", category: "Jersey" }),
    product({ id: 202, brand: "FYMA", category: "Jersey" }),
    product({ id: 203, brand: "ROCK THE STREET", category: "Hoodies" }),
  ];

  it("sans filtre conserve tout le catalogue", () => {
    expect(filterByBrand(catalog, null)).toHaveLength(3);
  });

  it("filtre par marque", () => {
    const fyma = filterByBrand(catalog, "FYMA");
    expect(fyma).toHaveLength(1);
    expect(fyma[0]?.id).toBe(202);
  });

  it("se cumule avec le filtre catégorie", () => {
    const brandScoped = filterByBrand(catalog, "DINGRY");
    const jerseys = filterCatalogProducts(brandScoped, "jersey");
    expect(jerseys).toHaveLength(1);
    expect(jerseys[0]?.id).toBe(201);
  });
});