import { describe, expect, it } from "vitest";
import type { AdminOrder } from "@/lib/admin/types";
import { orderPatchHasChanges } from "@/lib/admin/store";
import { stockPatchAfterShort } from "@/lib/order-stock-finalize";

const sampleOrder = (overrides: Partial<AdminOrder> = {}): AdminOrder => ({
  id: "o1",
  customerName: "A",
  email: "a@b.c",
  total: 1,
  items: [],
  status: "En attente",
  createdAt: "2026-01-01T00:00:00.000Z",
  source: "paypal",
  stockPending: true,
  stockApplied: false,
  ...overrides,
});

describe("orderPatchHasChanges", () => {
  it("deux patchs successifs identiques aux valeurs courantes → pas de changement", () => {
    const current = sampleOrder({ stockPending: false, stockApplied: true });
    const patch = { stockPending: false, stockApplied: true };
    expect(orderPatchHasChanges(current, patch)).toBe(false);
    expect(orderPatchHasChanges(current, patch)).toBe(false);
  });

  it("détecte stockPending, stockApplied et status séparément", () => {
    expect(orderPatchHasChanges(sampleOrder(), { stockPending: false })).toBe(true);
    expect(orderPatchHasChanges(sampleOrder(), { stockApplied: true })).toBe(true);
    expect(orderPatchHasChanges(sampleOrder(), { status: "À vérifier" })).toBe(true);
  });
});

describe("stockPatchAfterShort + alerte", () => {
  it("rupture sur commande Expédiée produit un patch qui change le store", () => {
    const current = sampleOrder({ status: "Expédié" });
    const patch = stockPatchAfterShort(current);
    expect(orderPatchHasChanges(current, patch)).toBe(true);
    expect(patch.status).toBeUndefined();
  });
});
