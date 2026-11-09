import { describe, expect, it } from "vitest";
import { productModalDataFromShop } from "./product-modal.types";
import type { ShopProduct } from "@/lib/catalog";

describe("productModalDataFromShop", () => {
  it("mappe un produit boutique vers le contrat modale", () => {
    const product = {
      id: 11,
      name: "TEE DINGRY",
      variant: "WHITE",
      price: 80,
      image: "https://example.com/tee.webp",
      description: "",
      category: "T-shirts",
    } satisfies ShopProduct;
    const data = productModalDataFromShop(product);
    expect(data?.id).toBe(11);
    expect(data?.title).toBe("TEE DINGRY");
    expect(data?.coverUrl).toBe("https://example.com/tee.webp");
    expect(data?.slug.length).toBeGreaterThan(0);
  });

  it("refuse un id invalide", () => {
    const product = {
      id: 0,
      name: "TEE",
      variant: "WHITE",
      price: 10,
      image: "https://example.com/x.webp",
      description: "",
      category: "T-shirts",
    } satisfies ShopProduct;
    expect(productModalDataFromShop(product)).toBeNull();
  });
});
