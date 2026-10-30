import { describe, expect, it, vi } from "vitest";
import type { AdminOrder } from "@/lib/admin/types";
import {
  finalizeOrderStock,
  isStockReconcileCandidate,
  stockPatchAfterApply,
  stockPatchAfterShort,
} from "@/lib/order-stock-finalize";

const baseOrder = (overrides: Partial<AdminOrder> = {}): AdminOrder => ({
  id: "test-order",
  customerName: "Test",
  email: "t@test.com",
  total: 10,
  items: [],
  status: "En attente",
  createdAt: new Date().toISOString(),
  source: "paypal",
  stockLines: [{ productId: 11, qty: 1 }],
  stockPending: true,
  stockApplied: false,
  ...overrides,
});

describe("stockPatchAfterApply", () => {
  it("no-op si stock déjà finalisé côté store", () => {
    expect(stockPatchAfterApply(baseOrder({ stockPending: false }))).toEqual({});
  });

  it("ne modifie pas le statut", () => {
    expect(stockPatchAfterApply(baseOrder({ status: "Expédié" }))).toEqual({
      stockPending: false,
      stockApplied: true,
    });
  });
});

describe("stockPatchAfterShort", () => {
  it("marque terminal À vérifier depuis En attente", () => {
    expect(stockPatchAfterShort(baseOrder())).toEqual({
      stockPending: false,
      stockApplied: false,
      status: "À vérifier",
    });
  });

  it("ne rétrograde pas un statut déjà avancé par l’admin", () => {
    expect(stockPatchAfterShort(baseOrder({ status: "Expédié" }))).toEqual({
      stockPending: false,
      stockApplied: false,
    });
  });

  it("no-op si stockPending déjà false", () => {
    expect(stockPatchAfterShort(baseOrder({ stockPending: false }))).toEqual({});
  });
});

describe("isStockReconcileCandidate", () => {
  it("exclut les commandes short (À vérifier, stockPending false)", () => {
    expect(
      isStockReconcileCandidate(
        baseOrder({ status: "À vérifier", stockPending: false, stockApplied: false }),
      ),
    ).toBe(false);
  });

  it("inclut stockPending avec lignes et statut En attente", () => {
    expect(isStockReconcileCandidate(baseOrder())).toBe(true);
  });

  it("exclut stockPending sans stockLines", () => {
    expect(isStockReconcileCandidate(baseOrder({ stockLines: [] }))).toBe(false);
  });
});

describe("finalizeOrderStock — upsert KO puis rejeu", () => {
  it("applied via code 2 finalise la commande au second passage", async () => {
    vi.resetModules();
    const patchOrder = vi
      .fn()
      .mockRejectedValueOnce(new Error("store write failed"))
      .mockImplementation(async (_id: string, mutate: (c: AdminOrder) => Partial<AdminOrder>) => {
        const current = baseOrder();
        const patch = mutate(current);
        return { order: { ...current, ...patch }, changed: true };
      });

    vi.doMock("@/lib/admin/store", () => ({
      patchOrder,
    }));

    vi.doMock("@/lib/stock", async () => {
      const actual = await vi.importActual<typeof import("@/lib/stock")>("@/lib/stock");
      return {
        ...actual,
        applyCheckoutStock: vi.fn().mockResolvedValue("applied"),
        alertStockVerification: vi.fn(),
      };
    });

    const { finalizeOrderStock: finalize } = await import("@/lib/order-stock-finalize");

    const order = baseOrder();
    await expect(finalize(order)).rejects.toThrow("store write failed");

    const after = await finalize(order);
    expect(after.stockPending).toBe(false);
    expect(after.stockApplied).toBe(true);
    expect(patchOrder).toHaveBeenCalledTimes(2);

    vi.doUnmock("@/lib/admin/store");
    vi.doUnmock("@/lib/stock");
    vi.resetModules();
  });
});
