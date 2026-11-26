import { describe, expect, it } from "vitest";
import type { ShopProduct } from "@/lib/catalog";
import {
  pdpLimitedEditionBadge,
  pdpSubtitle,
  shouldShowPdpColorSwatches,
  showPdpFreeShippingReassurance,
  showPdpCustomButton,
} from "@/lib/storefront/pdp-display";

const base: ShopProduct = {
  id: 6,
  name: "Hoodie DINGRY Original",
  variant: "BLACK — RECTO",
  price: 80,
  image: "https://example.test/hoodie.jpg",
  description: "Description CRM.",
  category: "Hoodies",
  sizes: ["S", "M", "L", "XL"],
};

describe("pdpSubtitle", () => {
  it("ignore les segments vides", () => {
    const line = pdpSubtitle({ ...base, materials: "", sizeGuide: "", variant: "— RECTO" });
    expect(line).not.toContain(" / / ");
    expect(line.length).toBeGreaterThan(0);
  });

  it("joint couleur / sizeGuide / matière depuis le produit", () => {
    const text = pdpSubtitle({
      ...base,
      materials: "Coton 480 g/m²",
      sizeGuide: "Coupe oversize unisexe",
    });
    expect(text).toContain("Coupe oversize unisexe");
    expect(text).toContain("Coton 480 g/m²");
  });
});

describe("shouldShowPdpColorSwatches", () => {
  it("masque à un seul coloris", () => {
    expect(shouldShowPdpColorSwatches(1)).toBe(false);
    expect(shouldShowPdpColorSwatches(0)).toBe(false);
    expect(shouldShowPdpColorSwatches(2)).toBe(true);
  });
});

describe("showPdpFreeShippingReassurance", () => {
  it("masqué si seuil null ou invalide", () => {
    expect(showPdpFreeShippingReassurance(null)).toBe(false);
    expect(showPdpFreeShippingReassurance(0)).toBe(false);
    expect(showPdpFreeShippingReassurance(-10)).toBe(false);
  });

  it("affiché si seuil positif", () => {
    expect(showPdpFreeShippingReassurance(150)).toBe(true);
  });
});

describe("pdpLimitedEditionBadge", () => {
  it("conditionnel sur limitedEdition produit", () => {
    expect(pdpLimitedEditionBadge({ limitedEdition: "" })).toBeNull();
    expect(pdpLimitedEditionBadge({ limitedEdition: "  Édition limitée  " })).toBe("Édition limitée");
  });
});

describe("showPdpCustomButton", () => {
  it("uniquement id 24", () => {
    expect(showPdpCustomButton(24)).toBe(true);
    expect(showPdpCustomButton(11)).toBe(false);
  });
});