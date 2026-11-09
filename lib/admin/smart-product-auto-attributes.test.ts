import { describe, expect, it } from "vitest";
import { buildColorDeclinationBackendFields } from "@/lib/admin/dingry-color-palette";
import { parseSmartProductText } from "@/lib/admin/smart-product-text-parser";
import {
  applyCatalogProductMatrix,
  applyCategoryDefaults,
  applyParsedProductDefaults,
  catalogMatrixFromAdminProduct,
  CATEGORY_DEFAULT_PROFILES,
  createNewProductFormState,
  patchFormFromSmartParse,
  type SmartProductAutoTagFormState,
} from "@/lib/admin/smart-product-auto-attributes";
import type { AdminProduct } from "@/lib/admin/types";
import { DEFAULT_SHOP_PRODUCT_STOCK } from "@/lib/shop-data";
import { EMPTY_PRODUCT_STORY } from "@/lib/admin/product-story";
import type { ProductCategory } from "@/lib/admin/types";

function emptyForm(category: ProductCategory = "T-shirts"): SmartProductAutoTagFormState {
  return {
    sku: "",
    name: "",
    variant: "",
    colorDeclinations: [],
    category,
    price: "",
    stock: "99",
    sizes: [],
    ...EMPTY_PRODUCT_STORY,
  };
}

describe("smart-product-auto-attributes", () => {
  it("nouveau Hoodie : tailles S–2XL, SKU DGRY-HD, sans matières/grammage auto", () => {
    const next = applyCategoryDefaults(emptyForm(), "Hoodies", {
      editingId: null,
      existingSkus: ["DGRY-HD-01"],
    });
    expect(next.sizes).toEqual(["S", "M", "L", "XL", "2XL"]);
    expect(next.sku).toBe("DGRY-HD-02");
    expect(next.materials).toBe("");
    expect(next.sizeGuide).toBe("400 g/m²");
    expect(next.price).toBe(String(CATEGORY_DEFAULT_PROFILES.Hoodies.suggestedPriceLabel));
  });

  it("nouvelle fiche : Crewnecks → Pants vide la description crewneck", () => {
    const prev: SmartProductAutoTagFormState = {
      ...emptyForm("Crewnecks"),
      description: "Col ras du cou. Confort duveteux.",
      materials: "50 % coton, 50 % polyester",
    };
    const next = applyCategoryDefaults(prev, "Pants", {
      editingId: null,
      existingSkus: [],
    });
    expect(next.description).toBe("");
    expect(next.materials).toBe("");
    expect(next.category).toBe("Pants");
  });

  it("édition : change catégorie efface la description, garde matières saisies", () => {
    const prev: SmartProductAutoTagFormState = {
      ...emptyForm("T-shirts"),
      sku: "DGRY-TS-01",
      description: "Texte crewneck hérité",
      materials: "80 % coton bio saisi à la main",
      sizes: ["M", "L"],
    };
    const next = applyCategoryDefaults(prev, "Hoodies", {
      editingId: "42",
      existingSkus: [],
    });
    expect(next.description).toBe("");
    expect(next.materials).toBe("80 % coton bio saisi à la main");
    expect(next.category).toBe("Hoodies");
  });

  it("smart parse crewneck : ne remplace pas matières / grammage parsés", () => {
    const raw = `Produit : CREWNECKS
Titre Nom CREWNECKS LIGHT
50% Coton, 50% polaire
Grammage 257 g/m
Prix : 80`;
    const parsed = parseSmartProductText(raw, "T-shirts");
    const prev = emptyForm("T-shirts");
    const next = applyParsedProductDefaults(prev, parsed, { editingId: null, existingSkus: [] });
    expect(next.materials).toContain("50% Coton");
    expect(next.sizeGuide).toContain("257 g/m²");
    expect(next.category).toBe("Crewnecks");
    expect(next.materials).not.toMatch(/indicatif/i);
  });

  it("nouvelle fiche T-shirts : stock initial 10", () => {
    const next = createNewProductFormState("T-shirts", []);
    expect(next.stock).toBe(String(DEFAULT_SHOP_PRODUCT_STOCK));
    expect(DEFAULT_SHOP_PRODUCT_STOCK).toBe(10);
  });

  it("smart parse : change catégorie remplace description crewneck par argu pantalon", () => {
    const raw = `Pants\nJOGPANT SIGNATURE\nargu : coupe oversize et ceinture élastique\n110 €`;
    const parsed = parseSmartProductText(raw, "Crewnecks");
    const prev = {
      ...emptyForm("Crewnecks"),
      description: "Col ras du cou. Confort duveteux.",
    };
    const next = applyParsedProductDefaults(prev, parsed, { editingId: null, existingSkus: [] });
    expect(next.category).toBe("Pants");
    expect(next.description).toContain("coupe oversize");
    expect(next.description).not.toMatch(/col ras du cou/i);
  });

  it("smart parse : grammage collage remplace 257 g/m² hérité", () => {
    const raw = `PANTS
Grammage
440g/m2
argu : jogpant oversize.`;
    const parsed = parseSmartProductText(raw, "Crewnecks");
    const prev = { ...emptyForm(), sizeGuide: "257 g/m²" };
    const next = patchFormFromSmartParse(prev, parsed, "fill-empty");
    expect(next.sizeGuide).toBe("440 g/m²");
  });

  it("smart parse : argu collage remplace description crewneck héritée", () => {
    const parsed = parseSmartProductText("argu : depuis collage jogpant", "Pants");
    const prev = {
      ...emptyForm(),
      description: "Col ras du cou. Pour un confort duveteux.",
    };
    const next = patchFormFromSmartParse(prev, parsed, "fill-empty");
    expect(next.description).toContain("collage jogpant");
    expect(next.description).not.toMatch(/col ras du cou/i);
  });

  it("smart parse : collage identique au fond — conserve la casse admin", () => {
    const parsed = parseSmartProductText("100% coton ", "T-shirts");
    const prev = { ...emptyForm(), materials: "100% Coton" };
    const next = patchFormFromSmartParse(prev, parsed, "fill-empty");
    expect(next.materials).toBe("100% Coton");
  });

  it("smart parse fill-empty : écrase si matière collage ≠ fiche", () => {
    const parsed = parseSmartProductText("70% coton peigné, 20% polyester", "Pants");
    const prev = {
      ...emptyForm("Pants"),
      materials: "50% Coton, 50% polaire polyester",
    };
    const next = patchFormFromSmartParse(prev, parsed, "fill-empty");
    expect(next.materials).toContain("70% coton");
    expect(next.materials).not.toContain("polaire");
  });

  it("smart parse : prix collage écrase le prix conseillé catégorie", () => {
    const parsed = parseSmartProductText("prix: 89", "Pants");
    const prev = applyCategoryDefaults(emptyForm("Pants"), "Pants", {
      editingId: null,
      existingSkus: [],
    });
    expect(prev.price).not.toBe("89");
    const next = patchFormFromSmartParse(prev, parsed, "fill-empty");
    expect(next.price).toBe("89");
  });

  it("smart parse : qte remplit le stock", () => {
    const parsed = parseSmartProductText("qte : 33", "T-shirts");
    const prev = { ...emptyForm(), stock: "10" };
    const next = patchFormFromSmartParse(prev, parsed, "fill-empty");
    expect(next.stock).toBe("33");
  });

  it("smart parse : qte inline après prix sur une ligne", () => {
    const parsed = parseSmartProductText("COULEUR : noir prix: 89 qte : 25", "Pants");
    expect(parsed.price).toBe("89");
    expect(parsed.stock).toBe("25");
    expect(parsed.filled).toEqual(expect.arrayContaining(["price", "stock"]));
  });

  it("smart parse : qte écrase le stock déjà renseigné (applyParsed)", () => {
    const prev = applyCategoryDefaults(
      { ...emptyForm("Pants"), stock: String(DEFAULT_SHOP_PRODUCT_STOCK) },
      "Pants",
      { editingId: null, existingSkus: [] },
    );
    const parsed = parseSmartProductText("qte : 25", "Pants");
    expect(parsed.filled).toContain("stock");
    const next = applyParsedProductDefaults(prev, parsed, {
      editingId: null,
      existingSkus: [],
    });
    expect(next.stock).toBe("25");
  });

  it("smart parse fill-empty : pas d’écrasement si collage sans story détectée", () => {
    const parsed = parseSmartProductText("Prix : 80", "T-shirts");
    const prev = { ...emptyForm(), description: "Texte manuel boutique" };
    const next = patchFormFromSmartParse(prev, parsed, "fill-empty");
    expect(next.description).toBe("Texte manuel boutique");
  });

  it("base catalogue : fill-empty ne écrase pas le grammage saisi", () => {
    const source = {
      id: "9",
      sku: "DGRY-HD-01",
      name: "Hoodie Ref",
      variant: "NOIR",
      description: "Desc ref",
      fabrication: "",
      limitedEdition: "",
      materials: "100 % coton",
      sizeGuide: "500 g/m²",
      printPlacement: "" as const,
      category: "Hoodies" as const,
      price: 95,
      sizes: ["S", "M", "L"],
      stock: 10,
      publishStatus: "live" as const,
      colorDeclinations: ["NOIR"],
      imageUrl: "",
      blobUrl: null,
      blobPathname: null,
      imageBackUrl: "",
      imageBackBlobUrl: null,
      imageBackBlobPathname: null,
      createdAt: "",
      isPinned: false,
      displayOrder: 0,
    } satisfies AdminProduct;
    const prev = { ...emptyForm(), sizeGuide: "Grammage perso admin" };
    const next = applyCatalogProductMatrix(prev, catalogMatrixFromAdminProduct(source), {
      editingId: null,
      existingSkus: [],
    });
    expect(next.sizeGuide).toBe("Grammage perso admin");
    expect(next.price).toBe("95");
  });

  it("couleur NOIR → variant_sku suffix BLK", () => {
    const meta = buildColorDeclinationBackendFields({
      productId: "1",
      productName: "Hoodie",
      parentSku: "DINGRY-HOODIE-ESS",
      colorLabel: "NOIR",
    });
    expect(meta.variantSku).toBe("DINGRY-HOODIE-ESS-BLK");
  });
});
