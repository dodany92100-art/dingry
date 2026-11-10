import { describe, expect, it } from "vitest";
import { toCatalogProduct, type AdminProduct, type CatalogProduct } from "@/lib/admin/types";
import { SEEDED_PRODUCTS } from "@/lib/admin/seed";
import { overlayShopCatalog, shopProductFromUnknown, type ShopProduct } from "@/lib/catalog";
import { sortCatalogProducts } from "@/lib/catalog-sort";
import { PRODUCTS } from "@/lib/shop-data";

const fallbackProduct = (id: number, price: number): ShopProduct => ({
  id,
  name: "Fallback",
  variant: "RECTO",
  price,
  image: "https://example.com/a.jpg",
  description: "",
  category: "Crewnecks",
});

const liveProduct = (partial: Partial<CatalogProduct> & Pick<CatalogProduct, "id" | "price" | "sku">): CatalogProduct => ({
  id: partial.id,
  sku: partial.sku,
  name: partial.name ?? "CRM name",
  variant: partial.variant ?? "CRM variant",
  description: partial.description ?? "",
  category: partial.category ?? "Crewnecks",
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

  it("prend la photo CRM plutôt que l’image canonique figée", () => {
    const crmPhoto = "https://cdn.example.com/fiche-admin.webp";
    const merged = overlayShopCatalog(
      [fallbackProduct(11, 80)],
      [liveProduct({ id: 11, sku: "DINGRY-T01", price: 80, image: crmPhoto })],
    );
    expect(merged[0]?.image).toBe(crmPhoto);
  });

  it("prend le nom et le prix CRM sur la fiche vitrine", () => {
    const merged = overlayShopCatalog(
      [fallbackProduct(11, 80)],
      [
        liveProduct({
          id: 11,
          sku: "DINGRY-T01",
          price: 95,
          name: "TEE DINGRY NOUVEAU",
          variant: "WHITE — DROP 2",
        }),
      ],
    );
    expect(merged[0]?.name).toBe("TEE DINGRY NOUVEAU");
    expect(merged[0]?.variant).toBe("WHITE — DROP 2");
    expect(merged[0]?.price).toBe(95);
  });

  it("ajoute les produits CRM absents du fallback statique", () => {
    const merged = overlayShopCatalog([], [liveProduct({ id: 99, sku: "DINGRY-X99", price: 50 })]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.id).toBe(99);
    expect(merged[0]?.sku).toBe("DINGRY-X99");
  });

  it("masque un id tombstone du fallback (ex. hoodie Paris 25–26)", () => {
    const merged = overlayShopCatalog(
      [fallbackProduct(25, 80), { ...fallbackProduct(26, 80), variant: "VERSO" }],
      [],
      ["25"],
    );
    expect(merged.some((p) => p.id === 25)).toBe(false);
    expect(merged.some((p) => p.id === 26)).toBe(false);
  });

  it("crmOnly : uniquement les fiches live (pas de fallback statique)", () => {
    const merged = overlayShopCatalog(
      [fallbackProduct(1, 189), fallbackProduct(39, 100)],
      [liveProduct({ id: 39, sku: "DINGRY-S03", price: 169 })],
      [],
      { crmOnly: true },
    );
    expect(merged.some((p) => p.id === 1)).toBe(false);
    expect(merged.find((p) => p.id === 39)?.price).toBe(169);
  });
});

function crmCatalogWireRow(id: number, displayOrder: number): unknown {
  const shop = PRODUCTS.find((p) => p.id === id);
  if (!shop) throw new Error(`seed manquant: ${id}`);
  const admin = {
    id: String(id),
    sku: `T-${id}`,
    name: shop.name,
    variant: shop.variant,
    description: shop.description ?? "",
    fabrication: "",
    limitedEdition: "",
    materials: "",
    sizeGuide: "",
    printPlacement: "",
    category: shop.category,
    price: shop.price,
    sizes: ["S", "M", "L", "XL"],
    stock: 5,
    publishStatus: "live",
    colorDeclinations: [],
    imageUrl: shop.image,
    blobUrl: null,
    blobPathname: null,
    imageBackUrl: "",
    imageBackBlobUrl: null,
    imageBackBlobPathname: null,
    createdAt: "2026-10-01T10:00:00.000Z",
    isPinned: false,
    displayOrder,
  } as AdminProduct;
  const catalog = toCatalogProduct(admin);
  if (!catalog) throw new Error(`catalogue null: ${id}`);
  return JSON.parse(JSON.stringify(catalog));
}

describe("ordre vitrine = ordre CRM (aller-retour /api/catalog)", () => {
  it("displayOrder 0 conservé : #35 avant #7 en tri Sélection", () => {
    const wire = [crmCatalogWireRow(7, 1), crmCatalogWireRow(35, 0)];
    const live = wire.map((row) => shopProductFromUnknown(row)).filter((p) => p !== null);
    expect(live.find((p) => p.id === 35)?.displayOrder).toBe(0);
    expect(live.find((p) => p.id === 7)?.displayOrder).toBe(1);
    const shop = overlayShopCatalog(PRODUCTS, live);
    const hoodies = shop.filter((p) => p.id === 7 || p.id === 35);
    const sorted = sortCatalogProducts(hoodies, "featured");
    expect(sorted.map((p) => p.id)).toEqual([35, 7]);
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
      category: "Crewnecks",
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
