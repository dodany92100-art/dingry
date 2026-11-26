import { describe, expect, it } from "vitest";
import {
  BRAND_PAGE_SLUGS,
  brandPageConfigForSlug,
  DINGRY_MADA_COLLECTION,
} from "@/lib/shop-brand-page-config";
import { parseBrandPageSlug } from "@/lib/shop-brand-page-slug";
import {
  filterBrandCatalog,
  filterBrandCatalogExcludingCollection,
} from "@/lib/filter-brand-catalog";
import type { ShopProduct } from "@/lib/catalog";

describe("shop-brand-page slugs & config", () => {
  it("reconnaît les 3 slugs officiels", () => {
    for (const slug of BRAND_PAGE_SLUGS) {
      expect(parseBrandPageSlug(slug)).toBe(slug);
      expect(brandPageConfigForSlug(slug)?.slug).toBe(slug);
    }
  });

  it("rejette un slug inconnu (fallback notFound côté route)", () => {
    expect(parseBrandPageSlug("dingry-mada")).toBeNull();
    expect(parseBrandPageSlug("acme")).toBeNull();
    expect(brandPageConfigForSlug("dingry-mada")).toBeNull();
  });

  it("DINGRY MADA est rattaché à la page DINGRY, pas une 4e URL", () => {
    const dingry = brandPageConfigForSlug("dingry");
    expect(dingry?.brand).toBe("DINGRY");
    expect(dingry?.madaSection?.collection).toBe(DINGRY_MADA_COLLECTION);
    expect(parseBrandPageSlug("dingry-mada")).toBeNull();
    expect(brandPageConfigForSlug("fyma")?.madaSection).toBeUndefined();
  });
});

function p(partial: Partial<ShopProduct> & Pick<ShopProduct, "id">): ShopProduct {
  const { id, ...rest } = partial;
  return {
    name: "T",
    variant: "",
    price: 40,
    image: "https://example.com/x.webp",
    description: "",
    category: "Jersey",
    brand: "DINGRY",
    collection: "Signature",
    ...rest,
    id,
  };
}

describe("filterBrandCatalog", () => {
  const rows = [
    p({ id: 1, brand: "DINGRY", collection: "Signature" }),
    p({ id: 2, brand: "DINGRY", collection: "DINGRY MADA" }),
    p({ id: 3, brand: "FYMA", collection: "Signature" }),
  ];

  it("filtre marque + collection MADA", () => {
    const mada = filterBrandCatalog(rows, "DINGRY", "DINGRY MADA");
    expect(mada).toHaveLength(1);
    expect(mada[0]?.id).toBe(2);
  });

  it("exclut la collection MADA sur la grille principale DINGRY", () => {
    const main = filterBrandCatalogExcludingCollection(rows, "DINGRY", "DINGRY MADA");
    expect(main.map((item) => item.id)).toEqual([1]);
  });
});