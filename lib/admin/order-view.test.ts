import { describe, expect, it } from "vitest";
import type { AdminOrder } from "@/lib/admin/types";
import {
  countPendingShipments,
  countStockPending,
  selectPaypalOrders,
} from "@/lib/admin/order-view";

function order(partial: Partial<AdminOrder> & Pick<AdminOrder, "id" | "status">): AdminOrder {
  return {
    customerName: "Test",
    email: "t@test.fr",
    total: 35,
    items: ["Tee × 1"],
    createdAt: "2026-11-01T12:00:00.000Z",
    source: "paypal",
    ...partial,
  };
}

describe("selectPaypalOrders", () => {
  it("ignore demo et trie statut puis date", () => {
    const list = selectPaypalOrders([
      order({ id: "a", status: "Livrée", createdAt: "2026-11-02T12:00:00.000Z" }),
      order({ id: "b", status: "Payée", createdAt: "2026-11-01T12:00:00.000Z" }),
      order({ id: "c", status: "Payée", createdAt: "2026-11-03T12:00:00.000Z" }),
      order({ id: "d", status: "À vérifier", createdAt: "2026-11-04T12:00:00.000Z" }),
    ]);
    expect(list.map((o) => o.id)).toEqual(["d", "c", "b", "a"]);
  });

  it("exclut les commandes demo", () => {
    const list = selectPaypalOrders([
      order({ id: "demo-1", status: "Payée", source: "demo" }),
      order({ id: "pp-1", status: "Payée" }),
    ]);
    expect(list.map((o) => o.id)).toEqual(["pp-1"]);
  });
});

describe("countPendingShipments", () => {
  it("compte Payée et En préparation", () => {
    const paypal = selectPaypalOrders([
      order({ id: "1", status: "Payée" }),
      order({ id: "2", status: "En préparation" }),
      order({ id: "3", status: "Expédiée" }),
    ]);
    expect(countPendingShipments(paypal)).toBe(2);
  });
});

describe("countStockPending", () => {
  it("stockPending sans stockApplied", () => {
    expect(
      countStockPending([
        order({ id: "1", status: "Payée", stockPending: true, stockApplied: false }),
        order({ id: "2", status: "Payée", stockPending: true, stockApplied: true }),
      ]),
    ).toBe(1);
  });
});
