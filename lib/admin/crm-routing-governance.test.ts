import { describe, expect, it } from "vitest";
import {
  canonicalColorDeclinationValue,
  colorDeclinationsCanonicallyEqual,
  DINGRY_COLOR_PRESETS,
} from "@/lib/admin/dingry-color-palette";
import { ADMIN_COLOR_PRESETS_CANONICAL } from "@/lib/admin/product-variant-presets";
import {
  applyCategoryDefaults,
  type SmartProductAutoTagFormState,
} from "@/lib/admin/smart-product-auto-attributes";
import { EMPTY_PRODUCT_STORY } from "@/lib/admin/product-story";
import { DEFAULT_SHOP_PRODUCT_STOCK } from "@/lib/shop-data";
import { colorAbbrevFromDeclinationLabel } from "@/lib/catalog/dingry-color-abbrev";

function emptyForm(): SmartProductAutoTagFormState {
  return {
    sku: "DGRY-HD-01",
    name: "Test",
    variant: "NOIR",
    colorDeclinations: ["NOIR"],
    category: "Hoodies",
    price: "90",
    stock: "8",
    sizes: ["M", "L"],
    ...EMPTY_PRODUCT_STORY,
    description: "Description admin",
    materials: "Matières admin",
    sizeGuide: "Grammage admin",
  };
}

describe("CRM routing governance", () => {
  it("stock global = 10", () => {
    expect(DEFAULT_SHOP_PRODUCT_STOCK).toBe(10);
  });

  it("pastilles canoniques · pas de BLACK/WHITE en grille", () => {
    expect(DINGRY_COLOR_PRESETS).toHaveLength(ADMIN_COLOR_PRESETS_CANONICAL.length);
    expect(DINGRY_COLOR_PRESETS.map((p) => p.presetKey)).toEqual([...ADMIN_COLOR_PRESETS_CANONICAL]);
    expect(DINGRY_COLOR_PRESETS.some((p) => p.presetKey === "BLACK")).toBe(false);
  });

  it("alias BLACK → clé canonique NOIR + BLK", () => {
    expect(canonicalColorDeclinationValue("BLACK")).toBe("NOIR");
    expect(colorAbbrevFromDeclinationLabel("BLACK")).toBe("BLK");
    expect(colorDeclinationsCanonicallyEqual("BLACK", "NOIR")).toBe(true);
  });

  it("changement catégorie (nouvelle fiche) : story réinitialisée + couleurs conservées", () => {
    const next = applyCategoryDefaults(emptyForm(), "Crewnecks", {
      editingId: null,
      existingSkus: ["DGRY-CR-01"],
    });
    expect(next.description).toBe("");
    expect(next.materials).toBe("");
    expect(next.sizeGuide).toBe("340 g/m²");
    expect(next.colorDeclinations).toEqual(["NOIR"]);
    expect(next.stock).toBe("8");
    expect(next.price).toBe("90");
  });
});
