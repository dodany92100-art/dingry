import { describe, expect, it } from "vitest";
import { toCatalogProduct, type CatalogProduct } from "@/lib/admin/types";
import { SEEDED_PRODUCTS } from "@/lib/admin/seed";
import { overlayShopCatalog, shopProductFromUnknown, type ShopProduct } from "@/lib/catalog";

const fallbackProduct = (id: number, price: number): ShopProduct => ({
  id,
  name: "Fallback",
  variant: "RECTO",
  price,
  image: "https://example.com/a.jpg",
  description: "",
  category: "Sweats",
});

const liveProduct = (partial: Partial<CatalogProduct> & Pick<CatalogProduct, "id" | "price" | "sku">): CatalogProduct => ({
  id: partial.id,
  sku: partial.sku,
  name: partial.name ?? "CRM name",
  variant: partial.variant ?? "CRM variant",
  description: partial.description ?? "",
  category: partial.category ?? "Sweats",
  price: partial.price,
  image: partial.image ?? "https://example.com/crm.jpg",
  sizes: partial.sizes ?? ["S", "M", "L", "XL"],
  stock: partial.stock ?? 10,
});

describe("overlayShopCatalog", () => {
  it("remplace prix et référence CRM sur un id vitrine existant", () => {
    const merged = overlayShopCatalog(
      [fallbackProduct(39, 100)],
      [liveProduct({ id: 39, sku: "DINGRY-S03", price: 169, name: "CREWNECK DINGRY PURPLE" })],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]?.price).toBe(169);
    expect(merged[0]?.sku).toBe("DINGRY-S03");
    expect(merged[0]?.name).toBe("CREWNECK DINGRY PURPLE");
  });

  it("conserve le fallback si l’id n’est pas dans le CRM", () => {
    const merged = overlayShopCatalog(
      [fallbackProduct(1, 189)],
      [liveProduct({ id: 39, sku: "DINGRY-S03", price: 169 })],
    );
    expect(merged.find((p) => p.id === 1)?.price).toBe(189);
    expect(merged.find((p) => p.id === 1)?.sku).toBeUndefined();
  });

  it("hérite prix, stock et SKU recto pour un verso sans fiche CRM (ex. id 8 → 6)", () => {
    const merged = overlayShopCatalog(
      [{ ...fallbackProduct(8, 189), variant: "BLACK — VERSO" }],
      [liveProduct({ id: 6, sku: "DINGRY-H04", price: 199, stock: 3 })],
    );
    const verso = merged.find((p) => p.id === 8);
    expect(verso?.price).toBe(199);
    expect(verso?.stock).toBe(3);
    expect(verso?.sku).toBe("DINGRY-H04-V");
    expect(verso?.variant).toContain("VERSO");
  });

  it("priorise une fiche CRM directe sur le verso avant l’héritage", () => {
    const merged = overlayShopCatalog(
      [fallbackProduct(40, 100)],
      [
        liveProduct({ id: 39, sku: "DINGRY-S03", price: 169 }),
        liveProduct({ id: 40, sku: "DINGRY-S03-V", price: 175 }),
      ],
    );
    expect(merged.find((p) => p.id === 40)?.price).toBe(175);
    expect(merged.find((p) => p.id === 40)?.sku).toBe("DINGRY-S03-V");
  });

  it("ajoute les produits CRM absents du fallback statique", () => {
    const merged = overlayShopCatalog([], [liveProduct({ id: 99, sku: "DINGRY-X99", price: 50 })]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.id).toBe(99);
    expect(merged[0]?.sku).toBe("DINGRY-X99");
  });
});

describe("shopProductFromUnknown", () => {
  it("parse prix et sku depuis /api/catalog", () => {
    const parsed = shopProductFromUnknown({
      id: 39,
      sku: "DINGRY-S03",
      name: "CREWNECK",
      variant: "PURPLE",
      price: 169,
      image: "https://example.com/x.jpg",
      category: "Sweats",
      sizes: ["M", "L"],
      inStock: false,
    });
    expect(parsed?.price).toBe(169);
    expect(parsed?.sku).toBe("DINGRY-S03");
    expect(parsed?.stock).toBe(0);
  });

  it("inStock true → stock positif pour la boutique", () => {
    const parsed = shopProductFromUnknown({
      id: 1,
      name: "X",
      price: 10,
      image: "https://example.com/x.jpg",
      inStock: true,
    });
    expect(parsed?.stock).toBe(1);
  });

  it("sans inStock ni stock → pas de rupture affichée côté boutique", () => {
    const parsed = shopProductFromUnknown({
      id: 2,
      name: "Y",
      price: 20,
      image: "https://example.com/y.jpg",
    });
    expect(parsed?.stock).toBeUndefined();
  });
});

describe("SEEDED_PRODUCTS → catalogue public", () => {
  it("chaque fiche seed CRM est exposable via toCatalogProduct", () => {
    for (const product of SEEDED_PRODUCTS) {
      const catalog = toCatalogProduct(product);
      expect(catalog, `id ${product.id}`).not.toBeNull();
      expect(catalog?.price).toBe(product.price);
      expect(catalog?.sku).toBe(product.sku);
    }
  });

  it("overlay seed sur fallback aligne prix et SKU (ex. crewneck 39)", () => {
    const seed = SEEDED_PRODUCTS.find((p) => p.id === "39");
    expect(seed).toBeDefined();
    const catalog = toCatalogProduct(seed!);
    expect(catalog).not.toBeNull();
    const merged = overlayShopCatalog([fallbackProduct(39, 999)], [catalog!]);
    expect(merged[0]?.price).toBe(seed!.price);
    expect(merged[0]?.sku).toBe(seed!.sku);
  });
});
