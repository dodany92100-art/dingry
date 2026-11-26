import { describe, expect, it } from "vitest";
import { parseProductFields } from "@/lib/admin/parse-product";

const minimalCreate = {
  sku: "DGRY-TST-01",
  name: "TEST PRODUCT",
  variant: "NOIR",
  category: "T-shirts",
  price: "45",
  stock: "5",
  sizes: "M,L",
  colorDeclinations: "",
  publishStatus: "draft",
  printPlacement: "",
  description: "",
  fabrication: "",
  limitedEdition: "",
  materials: "",
  sizeGuide: "",
};

describe("parseProductFields — brand / collection", () => {
  it("crée avec défauts DINGRY / Signature", () => {
    const { fields, error } = parseProductFields(minimalCreate);
    expect(error).toBeNull();
    expect(fields.brand).toBe("DINGRY");
    expect(fields.collection).toBe("Signature");
  });

  it("refuse une marque inconnue", () => {
    const { error } = parseProductFields({ ...minimalCreate, brand: "ACME" });
    expect(error).toMatch(/Marque invalide/);
  });

  it("refuse DINGRY MADA avec FYMA", () => {
    const { error } = parseProductFields({
      ...minimalCreate,
      brand: "FYMA",
      collection: "DINGRY MADA",
    });
    expect(error).toMatch(/DINGRY MADA/);
  });

  it("refuse DINGRY MADA avec ROCK THE STREET", () => {
    const { error } = parseProductFields({
      ...minimalCreate,
      brand: "ROCK THE STREET",
      collection: "DINGRY MADA",
    });
    expect(error).toMatch(/DINGRY MADA/);
  });

  it("accepte DINGRY MADA avec DINGRY", () => {
    const { fields, error } = parseProductFields({
      ...minimalCreate,
      brand: "DINGRY",
      collection: "DINGRY MADA",
    });
    expect(error).toBeNull();
    expect(fields.brand).toBe("DINGRY");
    expect(fields.collection).toBe("DINGRY MADA");
  });
});