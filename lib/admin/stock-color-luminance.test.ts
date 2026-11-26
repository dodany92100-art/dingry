import { describe, expect, it } from "vitest";
import {
  productPerceivedLuminance,
  sortProductsByColorLuminance,
  cycleStockColorSortMode,
} from "@/lib/admin/stock-color-luminance";
import type { AdminProduct } from "@/lib/admin/types";

function sample(variant: string): AdminProduct {
  return {
    id: variant,
    sku: "X",
    name: variant,
    variant,
    description: "",
    printPlacement: "",
    fabrication: "",
    limitedEdition: "",
    materials: "",
    sizeGuide: "",
    category: "T-shirts",
    brand: "DINGRY",
    collection: "Signature",
    price: 10,
    sizes: ["M"],
    stock: 1,
    publishStatus: "live",
    colorDeclinations: [],
    imageUrl: "",
    blobUrl: null,
    blobPathname: null,
    imageBackUrl: "",
    imageBackBlobUrl: null,
    imageBackBlobPathname: null,
    createdAt: "",
    isPinned: false,
    displayOrder: 0,
  };
}

describe("stock-color-luminance", () => {
  it("BLANC plus lumineux que NOIR", () => {
    expect(productPerceivedLuminance(sample("BLANC"))).toBeGreaterThan(
      productPerceivedLuminance(sample("NOIR")),
    );
  });

  it("tri clair puis sombre", () => {
    const sorted = sortProductsByColorLuminance(
      [sample("NOIR"), sample("BLANC"), sample("GRIS")],
      "light",
    );
    expect(sorted.map((p) => p.variant)).toEqual(["BLANC", "GRIS", "NOIR"]);
  });

  it("ordre famille Blanc · Gris · Vert · Bleu · Noir", () => {
    const sorted = sortProductsByColorLuminance(
      [sample("NOIR"), sample("BLEU"), sample("VERT"), sample("GRIS"), sample("BLANC")],
      "light",
    );
    expect(sorted.map((p) => p.variant)).toEqual(["BLANC", "GRIS", "VERT", "BLEU", "NOIR"]);
  });

  it("cycle tri", () => {
    expect(cycleStockColorSortMode("default")).toBe("light");
    expect(cycleStockColorSortMode("light")).toBe("dark");
    expect(cycleStockColorSortMode("dark")).toBe("default");
  });
});