import { beforeEach, describe, expect, it, vi } from "vitest";
import { SEEDED_PRODUCTS } from "@/lib/admin/seed";
import { quoteCheckout, VITRINE_ONLY, type CheckoutLine } from "@/lib/checkout-quote";
import { PRODUCTS } from "@/lib/shop-data";

vi.mock("@/lib/admin/store", () => ({
  loadStoreReadOnly: vi.fn(),
}));

vi.mock("@/lib/stock", () => ({
  assertCheckoutStock: vi.fn(async () => ({ ok: true as const })),
  stockLinesFromCheckout: vi.fn((lines: CheckoutLine[]) => lines.map((l) => ({ productId: l.productId, qty: l.qty }))),
  StockCheckoutError: class StockCheckoutError extends Error {},
}));

import { loadStoreReadOnly } from "@/lib/admin/store";

describe("quoteCheckout — prix CRM", () => {
  beforeEach(() => {
    vi.mocked(loadStoreReadOnly).mockResolvedValue({
      version: 4,
      products: SEEDED_PRODUCTS.map((p) => ({ ...p })),
      orders: [],
      lookbook: [],
    });
  });

  it("utilise le prix admin pour un id seed (39 crewneck)", async () => {
    const seed = SEEDED_PRODUCTS.find((p) => p.id === "39");
    expect(seed?.price).toBe(50);
    const quote = await quoteCheckout([{ productId: 39, size: "M", qty: 1 }]);
    expect(quote?.totalCents).toBe(5000);
  });

  it("prend en compte une modification CRM simulée", async () => {
    vi.mocked(loadStoreReadOnly).mockResolvedValue({
      version: 4,
      products: SEEDED_PRODUCTS.map((p) =>
        p.id === "39" ? { ...p, price: 179, sku: "DINGRY-S03-BIS" } : { ...p },
      ),
      orders: [],
      lookbook: [],
    });
    const quote = await quoteCheckout([{ productId: 39, size: "L", qty: 2 }]);
    expect(quote?.totalCents).toBe(35800);
  });

  it("retombe sur PRODUCTS (vitrine) si la fiche CRM est absente", async () => {
    vi.mocked(loadStoreReadOnly).mockResolvedValue({
      version: 4,
      products: [],
      orders: [],
      lookbook: [],
    });
    const quote = await quoteCheckout([{ productId: 39, size: "M", qty: 1 }]);
    expect(quote?.totalCents).toBe(5000);
  });

  it("refuse une référence retirée du catalogue (tombstone)", async () => {
    vi.mocked(loadStoreReadOnly).mockResolvedValue({
      version: 4,
      products: SEEDED_PRODUCTS.map((p) => ({ ...p })),
      orders: [],
      lookbook: [],
      removedCatalogIds: ["39"],
    });
    const quote = await quoteCheckout([{ productId: 39, size: "M", qty: 1 }]);
    expect(quote).toBeNull();
  });

  it("retombe sur VITRINE_ONLY si ni le verso ni le recto ne sont dans le CRM", async () => {
    vi.mocked(loadStoreReadOnly).mockResolvedValue({
      version: 4,
      products: [],
      orders: [],
      lookbook: [],
    });
    expect(VITRINE_ONLY[8]?.price).toBe(80);
    const quote = await quoteCheckout([{ productId: 8, size: "M", qty: 1 }]);
    expect(quote?.totalCents).toBe(8000);
  });

  it("accepte une taille vitrine si la fiche CRM a sizes: []", async () => {
    vi.mocked(loadStoreReadOnly).mockResolvedValue({
      version: 4,
      products: SEEDED_PRODUCTS.map((p) => (p.id === "39" ? { ...p, sizes: [] } : { ...p })),
      orders: [],
      lookbook: [],
    });
    const quote = await quoteCheckout([{ productId: 39, size: "M", qty: 1 }]);
    expect(quote?.totalCents).toBe(5000);
  });

  it("facture le prix CRM du recto pour un verso sans fiche (id 8 → 6)", async () => {
    vi.mocked(loadStoreReadOnly).mockResolvedValue({
      version: 4,
      products: SEEDED_PRODUCTS.map((p) =>
        p.id === "6" ? { ...p, price: 205 } : { ...p },
      ),
      orders: [],
      lookbook: [],
    });
    const quote = await quoteCheckout([{ productId: 8, size: "M", qty: 1 }]);
    expect(quote?.totalCents).toBe(20500);
  });
});

describe("alignement CRM / vitrine fallback", () => {
  it("les ids VITRINE_ONLY ne sont pas des fiches seed (prix codés en dur côté checkout)", () => {
    const seededIds = new Set(SEEDED_PRODUCTS.map((p) => Number(p.id)));
    for (const id of Object.keys(VITRINE_ONLY).map(Number)) {
      expect(seededIds.has(id), `id ${id} devrait rester vitrine-only ou être ajouté au CRM`).toBe(false);
    }
  });

  it("devis vitrine-only pour chaque id (taille M)", async () => {
    vi.mocked(loadStoreReadOnly).mockResolvedValue({
      version: 4,
      products: [],
      orders: [],
      lookbook: [],
    });
    for (const id of Object.keys(VITRINE_ONLY).map(Number)) {
      const quote = await quoteCheckout([{ productId: id, size: "M", qty: 1 }]);
      const shop = PRODUCTS.find((product) => product.id === id);
      const expectedEur = shop?.price ?? VITRINE_ONLY[id].price;
      expect(quote?.totalCents).toBe(Math.round(expectedEur * 100));
    }
  });
});
