import { describe, expect, it } from "vitest";
import type { AdminProduct } from "@/lib/admin/types";
import {
  applyDisplayOrderByIds,
  compareAdminProductDisplay,
  sortAdminProductsForDisplay,
  sortAdminProductsNewest,
} from "@/lib/admin/product-display-order";

function admin(partial: Partial<AdminProduct> & Pick<AdminProduct, "id">): AdminProduct {
  return {
    id: partial.id,
    sku: "SKU",
    name: partial.name ?? "Test",
    variant: "",
    description: "",
    fabrication: "",
    limitedEdition: "",
    materials: "",
    sizeGuide: "",
    category: partial.category ?? "T-shirts",
    price: 35,
    sizes: ["M"],
    stock: 5,
    publishStatus: "live",
    colorDeclinations: [],
    imageUrl: "/x.webp",
    blobUrl: null,
    blobPathname: null,
    createdAt: partial.createdAt ?? "2026-11-01T12:00:00.000Z",
    isPinned: partial.isPinned ?? false,
    displayOrder: partial.displayOrder ?? 0,
  };
}

describe("product-display-order", () => {
  it("épinglé avant non épinglé", () => {
    const pinned = admin({ id: "2", isPinned: true, createdAt: "2026-01-01T00:00:00.000Z" });
    const recent = admin({ id: "1", createdAt: "2026-11-05T00:00:00.000Z" });
    expect(compareAdminProductDisplay(pinned, recent)).toBeLessThan(0);
    expect(sortAdminProductsForDisplay([recent, pinned]).map((p) => p.id)).toEqual(["2", "1"]);
  });

  it("tri antichrono si displayOrder identique", () => {
    const older = admin({ id: "a", createdAt: "2026-10-01T00:00:00.000Z" });
    const newer = admin({ id: "b", createdAt: "2026-11-01T00:00:00.000Z" });
    expect(sortAdminProductsForDisplay([older, newer]).map((p) => p.id)).toEqual(["b", "a"]);
  });

  it("tie-break id numérique comme la boutique (id décroissant)", () => {
    const low = admin({ id: "11", createdAt: "2026-11-01T00:00:00.000Z", displayOrder: 0 });
    const high = admin({ id: "39", createdAt: "2026-11-01T00:00:00.000Z", displayOrder: 0 });
    expect(sortAdminProductsForDisplay([low, high]).map((p) => p.id)).toEqual(["39", "11"]);
  });

  it("applique displayOrder depuis une liste d’ids", () => {
    const a = admin({ id: "a", displayOrder: 9 });
    const b = admin({ id: "b", displayOrder: 1 });
    const next = applyDisplayOrderByIds([a, b], ["b", "a"]);
    expect(next.find((p) => p.id === "a")?.displayOrder).toBe(1);
    expect(next.find((p) => p.id === "b")?.displayOrder).toBe(0);
  });

  it("tri nouveauté strict sans displayOrder", () => {
    const manualFirst = admin({
      id: "old-manual",
      displayOrder: 0,
      createdAt: "2026-09-01T00:00:00.000Z",
    });
    const recent = admin({ id: "new", displayOrder: 99, createdAt: "2026-11-06T00:00:00.000Z" });
    expect(sortAdminProductsNewest([manualFirst, recent]).map((p) => p.id)).toEqual(["new", "old-manual"]);
  });
});
