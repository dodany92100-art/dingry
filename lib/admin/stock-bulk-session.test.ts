import { describe, expect, it } from "vitest";
import { selectedProductsForBulk, shouldPropagateBulkEdit } from "@/lib/admin/stock-bulk-session";

describe("shouldPropagateBulkEdit", () => {
  it("désactivé hors mode lot", () => {
    expect(shouldPropagateBulkEdit(false, "a", new Set(["a", "b"]))).toBe(false);
  });

  it("une seule case : pas de propagation", () => {
    expect(shouldPropagateBulkEdit(true, "a", new Set(["a"]))).toBe(false);
  });

  it("produit non coché : pas de propagation", () => {
    expect(shouldPropagateBulkEdit(true, "c", new Set(["a", "b"]))).toBe(false);
  });

  it("2+ cochés et produit dans la sélection", () => {
    expect(shouldPropagateBulkEdit(true, "b", new Set(["a", "b"]))).toBe(true);
  });
});

describe("selectedProductsForBulk", () => {
  const rows = [
    { id: "1", name: "A" },
    { id: "2", name: "B" },
    { id: "3", name: "C" },
  ];

  it("filtre par sélection", () => {
    expect(selectedProductsForBulk(rows, new Set(["2", "3"]))).toEqual([
      { id: "2", name: "B" },
      { id: "3", name: "C" },
    ]);
  });
});