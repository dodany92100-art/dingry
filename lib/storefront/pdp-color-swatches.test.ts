import { describe, expect, it } from "vitest";
import type { ShopProduct } from "@/lib/catalog";
import type { SimilarProductCard } from "@/lib/storefront/similar-products";
import { pdpColorVariantChoices, shouldShowPdpColorPicker } from "@/lib/storefront/pdp-color-swatches";

const product = (id: number, label: string): SimilarProductCard => ({
  product: { id, name: "Hoodie", variant: label, price: 80, image: "https://x.test/i.jpg", description: "", category: "Hoodies" } as ShopProduct,
  label,
  isActive: id === 6,
});

describe("pdpColorVariantChoices", () => {
  it("exclut le coloris actif", () => {
    const choices = pdpColorVariantChoices([
      product(6, "BLACK"),
      product(35, "WHITE"),
      product(27, "GREY"),
    ]);
    expect(choices.map((c) => c.label)).not.toContain("BLACK");
    expect(choices).toHaveLength(2);
  });

  it("ordonne du plus clair au plus foncé", () => {
    const choices = pdpColorVariantChoices([
      product(99, "ACTIVE"),
      product(1, "BLACK"),
      product(2, "WHITE"),
      product(3, "GREY"),
    ]);
    const labels = choices.map((c) => c.label);
    expect(labels.indexOf("WHITE")).toBeLessThan(labels.indexOf("GREY"));
    expect(labels.indexOf("GREY")).toBeLessThan(labels.indexOf("BLACK"));
  });
});

describe("shouldShowPdpColorPicker", () => {
  it("masqué s’il n’y a aucun autre coloris", () => {
    expect(shouldShowPdpColorPicker([product(6, "BLACK")])).toBe(false);
    expect(
      shouldShowPdpColorPicker([
        product(6, "BLACK"),
        product(35, "WHITE"),
      ]),
    ).toBe(true);
  });
});