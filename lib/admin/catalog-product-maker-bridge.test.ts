import { describe, expect, it } from "vitest";
import {
  adminProductPreuploadedImage,
  colorDeclinationsFromAdminProduct,
} from "@/lib/admin/catalog-product-maker-bridge";
import type { AdminProduct } from "@/lib/admin/types";

function sampleProduct(overrides: Partial<AdminProduct> = {}): AdminProduct {
  return {
    id: "1",
    sku: "SKU-1",
    name: "TEE",
    variant: "NOIR",
    category: "T-shirts",
    price: 35,
    sizes: ["M"],
    stock: 5,
    publishStatus: "live",
    colorDeclinations: [],
    description: "",
    fabrication: "",
    limitedEdition: "",
    materials: "",
    sizeGuide: "",
    printPlacement: "RECTO_ONLY",
    imageUrl: "https://cdn.example/tee.jpg",
    blobUrl: "https://cdn.example/tee.jpg",
    blobPathname: "dingry/products/1/recto.webp",
    imageBackUrl: "",
    imageBackBlobUrl: null,
    imageBackBlobPathname: null,
    createdAt: "",
    isPinned: false,
    displayOrder: 0,
    options: [
      {
        id: "o1",
        productId: "1",
        optionKey: "NOIR",
        label: "NOIR",
        skuSuffix: "BLK",
        brand: "DINGRY",
        color: "NOIR",
        variantSku: "SKU-1-BLK",
        altText: "",
        priceDelta: 0,
        imageUrl: "",
        imageBlobPathname: null,
        sortOrder: 0,
        isDefault: true,
      },
    ],
    ...overrides,
  };
}

describe("catalog-product-maker-bridge", () => {
  it("dérive les couleurs depuis product_options si colorDeclinations vide", () => {
    expect(colorDeclinationsFromAdminProduct(sampleProduct())).toEqual(["NOIR"]);
  });

  it("expose recto pré-enregistré", () => {
    const pre = adminProductPreuploadedImage(sampleProduct(), "recto");
    expect(pre?.url).toContain("tee.jpg");
    expect(pre?.pathname).toBe("dingry/products/1/recto.webp");
  });
});