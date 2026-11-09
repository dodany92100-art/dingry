import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildDingryVariantSku, buildVariantAltText, DINGRY_BRAND } from "@/lib/catalog/dingry-variant-naming";
import { normalizeOptionKey } from "@/lib/catalog/product-options";

type ImportAlbum = {
  brand: string;
  products: Array<{
    id: string;
    parent_sku: string;
    name: string;
    variants: Array<{
      color: string;
      variant_sku?: string;
      alt_text?: string;
    }>;
  }>;
};

const albumPath = path.join(process.cwd(), "data/examples/dingry-product-options-import.json");

describe("product-options-import-album", () => {
  const album = JSON.parse(readFileSync(albumPath, "utf8")) as ImportAlbum;

  it("JSON import exemple valide", () => {
    expect(album.brand).toBe(DINGRY_BRAND);
    expect(album.products.length).toBeGreaterThan(0);
  });

  it.each(album.products.map((p) => [p.id, p] as const))(
    "produit %s · SKUs et alt cohérents",
    (_id, product) => {
      for (const variant of product.variants) {
        const key = normalizeOptionKey(variant.color);
        expect(key.length).toBeGreaterThan(0);
        const sku = variant.variant_sku ?? buildDingryVariantSku(product.parent_sku, variant.color);
        expect(sku.toUpperCase()).toMatch(/^DINGRY-/);
        expect(sku).toContain(key.replace(/\s+/g, "_"));
        const alt = variant.alt_text ?? buildVariantAltText(product.name, variant.color);
        expect(alt).toContain("DINGRY");
      }
    },
  );
});
