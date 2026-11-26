import { describe, expect, it } from "vitest";
import type { ShopProduct } from "@/lib/catalog";
import { shopProductGroupingKey } from "@/lib/storefront/sku-model-grouping";

function product(partial: Partial<ShopProduct> & Pick<ShopProduct, "id">): ShopProduct {
  const { id, ...rest } = partial;
  return {
    name: "Test",
    variant: "RECTO",
    price: 50,
    image: "https://example.com/x.webp",
    description: "",
    category: "Hoodies",
    ...rest,
    id,
  };
}

describe("shopProductGroupingKey", () => {
  it("regroupe par réf. modèle SKU si format valide", () => {
    const a = product({
      id: 1,
      name: "Pull FYMA Fluffy",
      sku: "FYM-PUL-FLU-BEI-M",
    });
    const b = product({
      id: 2,
      name: "Pull FYMA Fluffy autre",
      sku: "FYM-PUL-FLU-NOI-S",
    });
    const fallbackA = "HOODIES::FOO";
    const fallbackB = "HOODIES::BAR";
    const keyA = shopProductGroupingKey(a, fallbackA);
    const keyB = shopProductGroupingKey(b, fallbackB);
    expect(keyA).toBe("sku-model::FYM-PUL-FLU");
    expect(keyB).toBe(keyA);
  });

  it("retombe sur la clé famille si SKU legacy", () => {
    const legacy = product({ id: 3, sku: "DGRY-HD-01", name: "Hoodie" });
    expect(shopProductGroupingKey(legacy, "fam::x")).toBe("fam::x");
  });
});