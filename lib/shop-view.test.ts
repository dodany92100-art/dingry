import { describe, expect, it } from "vitest";
import type { ShopProduct } from "@/lib/catalog";
import { PERSONALIZATION_SURCHARGE_EUR } from "@/lib/checkout-draft";
import {
  addCartLine,
  addPersonalizedCartLine,
  cartItemCount,
  cartSubtotal,
  modalSizesFor,
  personalizationLine,
  personalizationPreviewLabel,
  removeCartLine,
  sizeGridColumns,
  updateCartLineQuantity,
  updateCartLineSize,
} from "@/lib/shop-view";

const hoodie: ShopProduct = {
  id: 6,
  name: "Hoodie DINGRY Original BLACK",
  variant: "RECTO",
  price: 80,
  image: "x",
  description: "",
  category: "Hoodie",
};

const tee: ShopProduct = { ...hoodie, id: 24, name: "DINGRY TEE", price: 35, category: "T-shirts" };

describe("panier", () => {
  it("fusionne la même ligne et sépare les tailles", () => {
    let cart = addCartLine([], hoodie, "M", 1);
    cart = addCartLine(cart, hoodie, "M", 2);
    cart = addCartLine(cart, hoodie, "L", 1);
    expect(cart).toHaveLength(2);
    expect(cart[0]?.qty).toBe(3);
    expect(cartItemCount(cart)).toBe(4);
  });

  it("garde les lignes personnalisées séparées des lignes standard", () => {
    let cart = addCartLine([], tee, "M", 1);
    cart = addPersonalizedCartLine(cart, tee, "M", 1, "PARIS — Noir (recto)");
    cart = addPersonalizedCartLine(cart, tee, "M", 2, "PARIS — Noir (recto)");
    expect(cart).toHaveLength(2);
    expect(cart[1]?.qty).toBe(3);
  });

  it("supprime la ligne quand la quantité tombe à zéro", () => {
    const cart = addCartLine([], hoodie, "M", 1);
    expect(updateCartLineQuantity(cart, 0, -1)).toEqual([]);
    expect(updateCartLineQuantity(cart, 0, 1)[0]?.qty).toBe(2);
  });

  it("retire une ligne par index", () => {
    const cart = addCartLine(addCartLine([], hoodie, "M", 1), hoodie, "L", 1);
    expect(removeCartLine(cart, 0)).toHaveLength(1);
  });

  it("change la taille et fusionne si la cible existe", () => {
    let cart = addCartLine([], hoodie, "M", 2);
    cart = addCartLine(cart, hoodie, "L", 1);
    cart = updateCartLineSize(cart, 0, "L");
    expect(cart).toHaveLength(1);
    expect(cart[0]?.size).toBe("L");
    expect(cart[0]?.qty).toBe(3);
  });

  it("sépare deux produits identiques en tailles différentes", () => {
    const cart = addCartLine(addCartLine([], hoodie, "S", 1), hoodie, "L", 1);
    expect(cart).toHaveLength(2);
    expect(cart[0]?.size).toBe("S");
    expect(cart[1]?.size).toBe("L");
  });

  it("calcule le sous-total avec le supplément de personnalisation", () => {
    let cart = addCartLine([], hoodie, "M", 2);
    cart = addPersonalizedCartLine(cart, tee, "M", 1, "PARIS — Noir (recto)");
    expect(cartSubtotal(cart)).toBe(160 + 35 + PERSONALIZATION_SURCHARGE_EUR);
  });
});

describe("personnalisation", () => {
  it("construit la ligne et refuse un texte vide", () => {
    expect(personalizationLine("  paris ", "Noir")).toBe("paris — Noir (recto)");
    expect(personalizationLine("   ", "Noir")).toBeNull();
  });

  it("aperçu : défaut PARIS, majuscules, 28 caractères max", () => {
    expect(personalizationPreviewLabel("")).toBe("PARIS");
    expect(personalizationPreviewLabel("lyon")).toBe("LYON");
    expect(personalizationPreviewLabel("a".repeat(40))).toHaveLength(28);
  });
});

describe("tailles", () => {
  it("retombe sur la liste par défaut et choisit la grille", () => {
    expect(modalSizesFor({ ...hoodie, sizes: ["TU"] })).toEqual(["TU"]);
    expect(modalSizesFor(hoodie)).toContain("TU");
    expect(sizeGridColumns(["S", "M", "L", "XL"])).toBe(4);
    expect(sizeGridColumns(["S", "M", "L", "XL", "TU"])).toBe(6);
  });
});
