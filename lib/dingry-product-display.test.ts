import { describe, expect, it } from "vitest";
import type { ShopProduct } from "@/lib/catalog";
import {
  productDetailCopy,
  storefrontProductSubtitle,
  storefrontProductTitle,
} from "@/lib/dingry-product-display";

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

describe("storefrontProductSubtitle", () => {
  const crewneckRecto: ShopProduct = {
    id: 31,
    name: "Crewneck DINGRY Original YELLOW FLUO",
    variant: "RECTO",
    price: 50,
    image: "https://example.com/c.webp",
    description: "",
    category: "Crewnecks",
  };

  it("ne montre pas « RECTO » sous le titre quand le coloris est déjà dans le nom", () => {
    expect(storefrontProductSubtitle(crewneckRecto)).toBe("");
    expect(storefrontProductTitle(crewneckRecto)).toContain("YELLOW FLUO");
  });

  it("garde une ligne couleur lisible pour Paris noir", () => {
    const paris: ShopProduct = {
      id: 25,
      name: "HOODIE BLACK PARIS BACK-LOGO",
      variant: "NOIR PARIS — RECTO",
      price: 80,
      image: "https://example.com/h.webp",
      description: "",
      category: "Hoodies",
    };
    expect(storefrontProductSubtitle(paris)).toBe("NOIR PARIS");
  });
});
