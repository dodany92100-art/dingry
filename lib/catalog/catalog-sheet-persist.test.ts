import { describe, expect, it } from "vitest";
import type { AdminProduct } from "@/lib/admin/types";
import type { CatalogSheetCrmCandidate } from "@/lib/catalog/catalog-sheet";
import { catalogSheetImportKey } from "@/lib/catalog/catalog-sheet";
import {
  findAdminProductForCatalogCandidate,
  mergeCatalogImportIntoProduct,
  planCatalogSheetPersist,
} from "@/lib/catalog/catalog-sheet-persist";

function adminProduct(partial: Partial<AdminProduct> & Pick<AdminProduct, "id" | "sku">): AdminProduct {
  return {
    id: partial.id,
    sku: partial.sku,
    name: partial.name ?? "Test",
    variant: partial.variant ?? "Noir",
    description: partial.description ?? "",
    fabrication: partial.fabrication ?? "",
    limitedEdition: partial.limitedEdition ?? "",
    materials: partial.materials ?? "",
    sizeGuide: partial.sizeGuide ?? "",
    printPlacement: partial.printPlacement ?? "",
    category: partial.category ?? "T-shirts",
    brand: partial.brand ?? "FYMA",
    collection: partial.collection ?? "Signature",
    price: partial.price ?? 35,
    sizes: partial.sizes ?? ["M"],
    stock: partial.stock ?? 0,
    publishStatus: partial.publishStatus ?? "draft",
    colorDeclinations: partial.colorDeclinations ?? [],
    imageUrl: "/dingry-draft-product.svg",
    blobUrl: null,
    blobPathname: null,
    imageBackUrl: "",
    imageBackBlobUrl: null,
    imageBackBlobPathname: null,
    createdAt: partial.createdAt ?? "2026-01-01T00:00:00.000Z",
    isPinned: false,
    displayOrder: 0,
  };
}

const candidateBeigeM: CatalogSheetCrmCandidate = {
  modelRef: "FYM-PUL-FLU",
  modelName: "Pull fluffy FYMA beige",
  brand: "FYMA",
  category: "Crewnecks",
  color: "Beige",
  colorisCode: "BEI",
  unitPriceEuro: 120,
  sizes: ["M", "L"],
  skuBySize: {
    M: "FYM-PUL-FLU-BEI-M",
    L: "FYM-PUL-FLU-BEI-L",
  },
  gender: "Unisexe",
  shortDescription: "Accroche courte",
  longDescription: "Texte long",
  composition: "100% Nylon",
  highlights: "Douceur",
  variantSkus: ["FYM-PUL-FLU-BEI-M", "FYM-PUL-FLU-BEI-L"],
};

describe("findAdminProductForCatalogCandidate", () => {
  it("retrouve par SKU variante", () => {
    const products = [adminProduct({ id: "40", sku: "FYM-PUL-FLU-BEI-M", sizes: ["M"] })];
    const found = findAdminProductForCatalogCandidate(products, candidateBeigeM);
    expect(found?.id).toBe("40");
  });

  it("retrouve par clé modèle + coloris", () => {
    const products = [
      adminProduct({
        id: "41",
        sku: "FYM-PUL-FLU-BEI-XL",
        variant: "Beige",
        sizes: ["XL"],
      }),
    ];
    const found = findAdminProductForCatalogCandidate(products, candidateBeigeM);
    expect(found?.id).toBe("41");
  });
});

describe("mergeCatalogImportIntoProduct / idempotence", () => {
  it("fusionne les tailles sans écraser les textes existants (fill-empty)", () => {
    const existing = adminProduct({
      id: "40",
      sku: "FYM-PUL-FLU-BEI-M",
      name: "Pull fluffy FYMA beige",
      category: "Crewnecks",
      sizes: ["M"],
      description: "Déjà saisi",
      price: 120,
    });
    const patch = mergeCatalogImportIntoProduct(existing, candidateBeigeM, "fill-empty");
    expect(patch.sizes).toEqual(["M", "L"]);
    expect(patch.description).toBeUndefined();
    expect(patch.price).toBeUndefined();
  });

  it("réimport identique → noop, une seule ligne prix modifiée → update", () => {
    const existing = adminProduct({
      id: "40",
      sku: "FYM-PUL-FLU-BEI-M",
      name: "Pull fluffy FYMA beige",
      category: "Crewnecks",
      variant: "Beige",
      sizes: ["M", "L"],
      description: "Déjà saisi",
      materials: "100% Nylon",
      fabrication: "Douceur",
      limitedEdition: "Accroche courte",
      price: 120,
    });
    const second = planCatalogSheetPersist([existing], [candidateBeigeM]);
    expect(second.plans[0]?.action).toBe("noop");

    const priced = { ...candidateBeigeM, unitPriceEuro: 130 };
    const priceBump = planCatalogSheetPersist([existing], [priced]);
    expect(priceBump.plans[0]?.action).toBe("update");
    expect(priceBump.plans[0]?.fields?.price).toBe(130);
  });

  it("plan réimport : update tailles puis noop au second passage", () => {
    const existing = adminProduct({
      id: "40",
      sku: "FYM-PUL-FLU-BEI-M",
      name: "Pull fluffy FYMA beige",
      category: "Crewnecks",
      variant: "Beige",
      sizes: ["M"],
      description: "Déjà saisi",
      price: 120,
    });
    const first = planCatalogSheetPersist([existing], [candidateBeigeM]);
    expect(first.plans[0]?.action).toBe("update");

    const merged = mergeCatalogImportIntoProduct(existing, candidateBeigeM, "fill-empty");
    const after: AdminProduct = {
      ...existing,
      sizes: merged.sizes ?? existing.sizes,
      sku: merged.sku ?? existing.sku,
      description: "Déjà saisi",
      materials: "100% Nylon",
      fabrication: "Douceur",
      limitedEdition: "Accroche courte",
    };
    const second = planCatalogSheetPersist([after], [candidateBeigeM]);
    expect(second.plans[0]?.action).toBe("noop");
  });
});

describe("planCatalogSheetPersist", () => {
  it("assigne une clé import stable", () => {
    const plan = planCatalogSheetPersist([], [candidateBeigeM]);
    expect(plan.plans[0]?.importKey).toBe(catalogSheetImportKey(candidateBeigeM));
    expect(plan.plans[0]?.action).toBe("create");
    expect(plan.genderPendingSchema).toBe(true);
    expect(plan.unmatchedFields).toContain("gender");
  });
});