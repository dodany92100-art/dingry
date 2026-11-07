import { describe, expect, it } from "vitest";
import { adminProductToRow, rowToAdminProduct } from "@/lib/supabase/product-row";
import type { AdminProduct } from "@/lib/admin/types";

const sample: AdminProduct = {
  id: "31",
  sku: "DGRY-CT-01",
  name: "Crop Top",
  variant: "NOIR",
  description: "Test",
  fabrication: "",
  limitedEdition: "",
  materials: "",
  sizeGuide: "",
  printPlacement: "RECTO_ONLY",
  category: "Crop tops",
  price: 45,
  sizes: ["S", "M", "L"],
  stock: 4,
  publishStatus: "live",
  colorDeclinations: ["NOIR"],
  imageUrl: "https://example.com/a.webp",
  blobUrl: null,
  blobPathname: null,
  imageBackUrl: "",
  imageBackBlobUrl: null,
  imageBackBlobPathname: null,
  createdAt: "2026-11-07T00:00:00.000Z",
  isPinned: false,
  displayOrder: 2,
};

describe("product-row mapping", () => {
  it("round-trip AdminProduct ↔ row", () => {
    const row = adminProductToRow(sample);
    expect(row.publish_status).toBe("live");
    expect(row.image_url).toBe(sample.imageUrl);
    expect(rowToAdminProduct(row)).toMatchObject({
      id: "31",
      sku: "DGRY-CT-01",
      category: "Crop tops",
      publishStatus: "live",
      stock: 4,
    });
  });
});
