import { describe, expect, it } from "vitest";
import {
  buildFormDataComplete,
  colorDeclinationsEqual,
  formStateMatchesBaseline,
  parseColorDeclinationsInput,
  productEditorFormFrom,
  sectionDirtyFlags,
} from "@/lib/admin/product-editor-form";
import type { AdminProduct } from "@/lib/admin/types";

const sampleProduct = (overrides: Partial<AdminProduct> = {}): AdminProduct => ({
  id: "99",
  sku: "DGRY-TS-01",
  name: "Tee",
  variant: "Noir",
  colorDeclinations: ["Noir"],
  category: "T-shirts",
  price: 45,
  stock: 10,
  sizes: ["S", "M", "L"],
  description: "",
  fabrication: "",
  limitedEdition: "",
  materials: "",
  sizeGuide: "",
  printPlacement: "",
  imageUrl: "https://example.com/a.webp",
  blobUrl: null,
  blobPathname: null,
  imageBackUrl: "",
  imageBackBlobUrl: null,
  imageBackBlobPathname: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  publishStatus: "draft",
  displayOrder: 0,
  isPinned: false,
  ...overrides,
});

describe("product-editor-form", () => {
  it("formStateMatchesBaseline détecte un changement de prix", () => {
    const base = sampleProduct();
    const form = productEditorFormFrom(base);
    expect(formStateMatchesBaseline(form, base)).toBe(true);
    expect(formStateMatchesBaseline({ ...form, price: "46" }, base)).toBe(false);
  });

  it("sectionDirtyFlags marque price quand le stock change", () => {
    const form = productEditorFormFrom(sampleProduct());
    const baseline = productEditorFormFrom(sampleProduct());
    expect(sectionDirtyFlags({ ...form, stock: "5" }, baseline, false).price).toBe(true);
  });

  it("parseColorDeclinationsInput déduplique sans sensibilité à la casse", () => {
    expect(parseColorDeclinationsInput("noir, Noir, bleu")).toEqual(["NOIR", "bleu"]);
    expect(colorDeclinationsEqual(["Noir"], ["noir"])).toBe(true);
  });

  it("buildFormDataComplete inclut SKU et story", () => {
    const form = productEditorFormFrom(sampleProduct());
    const fd = buildFormDataComplete(form, null, null, "draft");
    expect(fd.get("sku")).toBe("DGRY-TS-01");
    expect(fd.get("publishStatus")).toBe("draft");
    expect(fd.get("description")).toBe("");
  });
});
