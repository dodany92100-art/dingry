import { describe, expect, it } from "vitest";
import type { ShopProduct } from "@/lib/catalog";
import { productDetailCopy } from "@/lib/dingry-product-display";

const hoodie: ShopProduct = {
  id: 6,
  name: "HOODIE DINGRY",
  variant: "NOIR",
  price: 189,
  image: "https://example.com/h.webp",
  description: "Texte CRM court.",
  category: "Hoodie",
};

describe("productDetailCopy", () => {
  it("affiche la description CRM même si elle est courte", () => {
    expect(productDetailCopy(hoodie).description).toBe("Texte CRM court.");
  });
});
