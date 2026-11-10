import { describe, expect, it } from "vitest";
import { toCatalogCards } from "@/lib/shop-catalog";

describe("toCatalogCards hoodies noirs", () => {
  it("garde #25 et masque #6 quand les deux sont présents", () => {
    const cards = toCatalogCards([
      { id: 6, variant: "RECTO", name: "Original" },
      { id: 25, variant: "NOIR PARIS — RECTO", name: "Paris" },
    ]);
    expect(cards.map((p) => p.id)).toEqual([25]);
  });

  it("garde #6 seul si #25 absent (ex. CRM live sans Paris)", () => {
    const cards = toCatalogCards([{ id: 6, variant: "RECTO" }]);
    expect(cards.map((p) => p.id)).toEqual([6]);
  });

  it("dédoublonne deux fiches CRM même id", () => {
    const cards = toCatalogCards([
      { id: 6, variant: "RECTO", name: "A" },
      { id: 6, variant: "RECTO", name: "Doublon" },
    ]);
    expect(cards).toHaveLength(1);
    expect(cards[0]?.name).toBe("A");
  });
});
