import { describe, expect, it } from "vitest";
import { buildStockBatchUpdates, hasUnsyncedStock } from "@/lib/admin/stock-autosave-build";

describe("buildStockBatchUpdates", () => {
  it("convertit les deltas en stocks absolus", () => {
    expect(
      buildStockBatchUpdates({ "12": 2, "34": -1 }, { "12": 10, "34": 5 }),
    ).toEqual([
      { id: "12", stock: 12 },
      { id: "34", stock: 4 },
    ]);
  });

  it("ignore delta nul", () => {
    expect(buildStockBatchUpdates({ "12": 0 }, { "12": 3 })).toEqual([]);
    expect(hasUnsyncedStock({ "12": 0 }, { "12": 3 })).toBe(false);
  });
});
