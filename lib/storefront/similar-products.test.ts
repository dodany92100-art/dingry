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

describe("similarProductsForShop", () => {
  it("propose les coloris hoodie Original en priorité", () => {
    const catalog: ShopProduct[] = [
      stub(6, "HOODIE DINGRY ORIGINAL", "NOIR"),
      stub(7, "HOODIE DINGRY ORIGINAL", "VERT"),
      stub(35, "HOODIE DINGRY ORIGINAL", "WHITE"),
      stub(37, "CAP DINGRY", "TU"),
    ];
    const result = similarProductsForShop(6, catalog);
    expect(result.variants.length).toBeGreaterThan(0);
    expect(result.variants.every((v) => !v.isActive)).toBe(true);
    expect(result.variants.some((v) => v.product.id === 6)).toBe(false);
    expect(result.crossSell).toHaveLength(0);
    expect(result.variants.some((v) => v.label.includes("VERT"))).toBe(true);
  });
});
