import { beforeEach, describe, expect, it } from "vitest";
import { nextOrderStatus } from "@/lib/admin/types";
import { aggregateStockLines } from "@/lib/stock";

describe("aggregateStockLines", () => {
  beforeEach(() => {
    process.env.STOCK_KEY_PREFIX = "dingry:";
  });

  it("agrège deux lignes du même produit", () => {
    const agg = aggregateStockLines([
      { productId: 11, qty: 1 },
      { productId: 11, qty: 2 },
      { productId: 24, qty: 1 },
    ]);
    expect(agg).toEqual([
      ["dingry:stock:11", 3],
      ["dingry:stock:24", 1],
    ]);
  });
});

describe("nextOrderStatus", () => {
  it("ne fait pas avancer une commande À vérifier sans statut explicite", () => {
    expect(nextOrderStatus("À vérifier")).toBe("À vérifier");
  });
});
