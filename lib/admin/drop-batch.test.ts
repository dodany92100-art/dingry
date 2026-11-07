import { describe, expect, it } from "vitest";
import { normalizeDropBatchItems, reconcileDropBatchWithCatalog } from "@/lib/admin/drop-batch";

describe("normalizeDropBatchItems", () => {
  it("accepte un lot ordre + publication", () => {
    const items = normalizeDropBatchItems([
      { id: "1", displayOrder: 0 },
      { id: "2", displayOrder: 1, status: "published" },
    ]);
    expect(items).toEqual([
      { id: "1", displayOrder: 0 },
      { id: "2", displayOrder: 1, status: "published" },
    ]);
  });

  it("fusionne un lot partiel avec le catalogue serveur", () => {
    const merged = reconcileDropBatchWithCatalog(
      [
        { id: "1", displayOrder: 5 },
        { id: "2", displayOrder: 1 },
        { id: "3", displayOrder: 2 },
      ],
      [
        { id: "1", displayOrder: 0 },
        { id: "2", displayOrder: 1 },
      ],
    );
    expect(merged).toEqual([
      { id: "1", displayOrder: 0 },
      { id: "2", displayOrder: 1 },
      { id: "3", displayOrder: 2 },
    ]);
  });

  it("rejette les ids dupliqués", () => {
    expect(
      normalizeDropBatchItems([
        { id: "1", displayOrder: 0 },
        { id: "1", displayOrder: 1 },
      ]),
    ).toBeNull();
  });
});
