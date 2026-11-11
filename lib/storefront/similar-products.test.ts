import { describe, expect, it } from "vitest";
import type { ShopProduct } from "@/lib/catalog";
import { shopProductColorVariants, similarProductsForShop } from "@/lib/storefront/similar-products";

function stub(id: number, name: string, variant: string, category = "Hoodies"): ShopProduct {
  return {
    id,
    name,
    variant,
    category,
    price: 80,
    image: `https://example.test/${id}.jpg`,
    sizes: ["S", "M", "L"],
    description: "",
    colorDeclinations: [],
  };
}

describe("shopProductColorVariants", () => {
  it("inclut toutes les déclinaisons du modèle, y compris la fiche ouverte", () => {
    const catalog: ShopProduct[] = [
      stub(6, "HOODIE DINGRY ORIGINAL", "NOIR"),
      stub(7, "HOODIE DINGRY ORIGINAL", "VERT"),
      stub(35, "HOODIE DINGRY ORIGINAL", "WHITE"),
    ];
    const variants = shopProductColorVariants(6, catalog);
    expect(variants.length).toBeGreaterThan(1);
    expect(variants.some((v) => v.isActive && v.product.id === 6)).toBe(true);
    expect(variants.some((v) => v.product.id === 7)).toBe(true);
  });

  it("relie les t-shirts collection 17 et 19 à la même grille DINGRY TEE", () => {
    const catalog: ShopProduct[] = [
      stub(17, "DINGRY TEE", "COLLECTION 07 — RECTO", "T-shirts"),
      stub(19, "DINGRY TEE", "COLLECTION 09 — RECTO", "T-shirts"),
    ];
    const from17 = shopProductColorVariants(17, catalog);
    const from19 = shopProductColorVariants(19, catalog);
    expect(from17).toHaveLength(2);
    expect(from19).toHaveLength(2);
    expect(from17.some((v) => v.product.id === 19)).toBe(true);
    expect(from19.some((v) => v.product.id === 17)).toBe(true);
  });

  it("affiche les deux coloris cap Original", () => {
    const catalog: ShopProduct[] = [stub(37, "CAP DINGRY Original BLACK", "TU", "Caps")];
    const variants = shopProductColorVariants(37, catalog);
    expect(variants).toHaveLength(2);
    expect(variants.some((v) => v.product.id === 38)).toBe(true);
  });

  it("affiche les trois coloris crewneck Original", () => {
    const catalog: ShopProduct[] = [
      stub(31, "Crewneck DINGRY Original YELLOW FLUO", "RECTO", "Crewnecks"),
    ];
    const variants = shopProductColorVariants(31, catalog);
    expect(variants).toHaveLength(3);
    expect(variants.some((v) => v.product.id === 33 || v.label.includes("BLUE"))).toBe(true);
  });

  it("affiche toute la ligne Original même si le CRM ne publie que deux coloris", () => {
    const catalog: ShopProduct[] = [
      stub(2, "Hoodie DINGRY Original KING BLUE / PINK", "RECTO"),
      stub(7, "Hoodie DINGRY Original VERT", "RECTO"),
    ];
    const variants = shopProductColorVariants(2, catalog);
    expect(variants.length).toBe(6);
  });

  it("propose la même grille depuis le coloris king blue / pink", () => {
    const catalog: ShopProduct[] = [
      stub(6, "Hoodie DINGRY Original BLACK", "RECTO"),
      stub(2, "Hoodie DINGRY Original KING BLUE / PINK", "RECTO"),
      stub(7, "Hoodie DINGRY Original VERT", "RECTO"),
      stub(29, "Hoodie DINGRY Original CHOCOLAT", "RECTO"),
      stub(35, "Hoodie DINGRY Original WHITE", "RECTO"),
    ];
    const fromBlack = shopProductColorVariants(6, catalog);
    const fromKingBlue = shopProductColorVariants(2, catalog);
    expect(fromKingBlue.length).toBe(fromBlack.length);
    expect(fromKingBlue.length).toBeGreaterThan(1);
    expect(fromKingBlue.some((v) => v.isActive && v.product.id === 2)).toBe(true);
  });
});

describe("similarProductsForShop", () => {
  it("délègue les coloris à la grille fiche quand le modèle a plusieurs déclinaisons", () => {
    const catalog: ShopProduct[] = [
      stub(6, "HOODIE DINGRY ORIGINAL", "NOIR"),
      stub(7, "HOODIE DINGRY ORIGINAL", "VERT"),
      stub(35, "HOODIE DINGRY ORIGINAL", "WHITE"),
      stub(37, "CAP DINGRY", "TU"),
    ];
    const result = similarProductsForShop(6, catalog);
    expect(result.variants).toHaveLength(0);
    expect(shopProductColorVariants(6, catalog).length).toBeGreaterThan(1);
  });

});
