import { describe, expect, it } from "vitest";
import { toCatalogProduct } from "@/lib/admin/types";
import { overlayShopCatalog } from "@/lib/catalog";
import { isVersoCatalogId } from "@/lib/catalog-verso-recto";
import { shopProductToImportAdminProduct } from "@/lib/admin/import-ghost-from-shop";
import { PRODUCTS } from "@/lib/shop-data";

describe("shopProductToImportAdminProduct", () => {
  it("mappe la fiche seed et conserve le SKU", () => {
    const shop = PRODUCTS.find((p) => p.id === 2);
    expect(shop).toBeDefined();
    const admin = shopProductToImportAdminProduct(shop!);
    expect(admin.publishStatus).toBe("live");
    expect(admin.name).toBe(shop!.name);
    expect(admin.price).toBe(shop!.price);
    expect(admin.imageUrl).toBe(shop!.image.trim());
    expect(admin.sku).toBe("DINGRY-H01");
  });
});

describe("import ghost : rendu boutique inchangé", () => {
  for (const shop of PRODUCTS.filter((p) => !isVersoCatalogId(p.id))) {
    it(`#${shop.id}`, () => {
      const live = toCatalogProduct(shopProductToImportAdminProduct(shop));
      expect(live).not.toBeNull();
      const after = overlayShopCatalog(PRODUCTS, [live!]).find((p) => p.id === shop.id);
      expect(after).toBeDefined();
      expect(after!.name).toBe(shop.name);
      expect(after!.variant).toBe(shop.variant);
      expect(after!.price).toBe(shop.price);
      expect(after!.image).toBe(shop.image);
    });
  }
});
