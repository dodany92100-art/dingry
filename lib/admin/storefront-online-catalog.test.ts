import { describe, expect, it } from "vitest";
import { createSeededStore } from "@/lib/admin/seed";
import { buildStorefrontOnlineProducts } from "@/lib/admin/storefront-online-catalog";

describe("buildStorefrontOnlineProducts", () => {
  it("marque ghost quand l’id n’est pas dans le CRM", () => {
    const store = createSeededStore();
    const online = buildStorefrontOnlineProducts(store);
    expect(online.length).toBeGreaterThan(0);
    const seeded = online.find((product) => product.id === 39);
    expect(seeded?.ghost).toBe(false);
  });

  it("ghost si la fiche CRM a été retirée du store", () => {
    const store = createSeededStore();
    store.products = store.products.filter((product) => product.id !== "39");
    const online = buildStorefrontOnlineProducts(store);
    const row = online.find((product) => product.id === 39);
    expect(row?.ghost).toBe(true);
  });
});
