import { describe, expect, it } from "vitest";
import type { AdminProduct } from "@/lib/admin/types";
import {
  adminProductCatalogSlug,
  buildAdminStockMenuSections,
} from "@/lib/admin/stock-menu-sections";

function admin(partial: Partial<AdminProduct> & Pick<AdminProduct, "id" | "category">): AdminProduct {
  return {
    id: partial.id,
    sku: "SKU",
    name: partial.name ?? "Test",
    variant: partial.variant ?? "RECTO",
    description: "",
    fabrication: "",
    limitedEdition: "",
    materials: "",
    sizeGuide: "",
    printPlacement: "",
    category: partial.category,
    price: 80,
    sizes: ["M"],
    stock: 3,
    publishStatus: "live",
    colorDeclinations: [],
    imageUrl: "/x.webp",
    blobUrl: null,
    blobPathname: null,
    imageBackUrl: "",
    imageBackBlobUrl: null,
    imageBackBlobPathname: null,
    createdAt: "2026-11-01T12:00:00.000Z",
    isPinned: false,
    displayOrder: 0,
  };
}

describe("buildAdminStockMenuSections", () => {
  it("groupe par slug menu boutique (ordre Hoodies → Caps)", () => {
    const sections = buildAdminStockMenuSections([
      admin({ id: "101", category: "Caps", name: "Cap" }),
      admin({ id: "102", category: "Hoodies", name: "Hoodie" }),
    ]);
    expect(sections.map((s) => s.category)).toEqual(["hoodies", "pants", "crop-top", "caps"]);
    expect(sections[0]?.products[0]?.id).toBe("102");
  });

  it("mappe Crewnecks vers sweats", () => {
    expect(adminProductCatalogSlug(admin({ id: "39", category: "Crewnecks" }))).toBe("sweats");
  });

  it("exclut les fiches verso (hoodies, tees, sweats)", () => {
    const sections = buildAdminStockMenuSections([
      admin({ id: "25", category: "Hoodies", variant: "NOIR PARIS — RECTO" }),
      admin({ id: "26", category: "Hoodies", variant: "VERSO" }),
      admin({ id: "11", category: "T-shirts", variant: "BLANC" }),
      admin({ id: "12", category: "T-shirts", variant: "BLANC — VERSO" }),
    ]);
    const hoodies = sections.find((s) => s.category === "hoodies")?.products ?? [];
    expect(hoodies.map((p) => p.id)).toEqual(["25"]);
    const allIds = sections.flatMap((s) => s.products.map((p) => p.id));
    expect(allIds).not.toContain("8");
    expect(allIds).not.toContain("12");
  });

  it("exclut verso #26 même sans mot VERSO dans la variante + dédoublonne #6", () => {
    const sections = buildAdminStockMenuSections([
      admin({ id: "6", category: "Hoodies", variant: "RECTO" }),
      admin({ id: "6", category: "Hoodies", variant: "RECTO", name: "Doublon CRM" }),
      admin({ id: "25", category: "Hoodies", variant: "NOIR PARIS — RECTO" }),
      admin({ id: "26", category: "Hoodies", variant: "NOIR PARIS — DOS" }),
    ]);
    const hoodies = sections.find((s) => s.category === "hoodies")?.products ?? [];
    expect(hoodies.map((p) => p.id).sort((a, b) => Number(a) - Number(b))).toEqual(["25"]);
  });

  it("garde #6 admin si #25 absent", () => {
    const sections = buildAdminStockMenuSections([
      admin({ id: "6", category: "Hoodies", variant: "NOIR ORIGINAL" }),
    ]);
    const hoodies = sections.find((s) => s.category === "hoodies")?.products ?? [];
    expect(hoodies.map((p) => p.id)).toEqual(["6"]);
  });

  it("tee noir #21 seul : #24 (perso checkout) masqué", () => {
    const sections = buildAdminStockMenuSections([
      admin({ id: "21", category: "T-shirts", variant: "NOIR — RECTO", name: "DINGRY TEE" }),
      admin({ id: "24", category: "T-shirts", variant: "PERSONNALISÉ — RECTO", name: "DINGRY TEE" }),
    ]);
    const tees = sections.find((s) => s.category === "t-shirts")?.products ?? [];
    expect(tees.map((p) => p.id)).toEqual(["21"]);
  });
});
