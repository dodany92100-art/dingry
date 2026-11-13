import { describe, expect, it, vi } from "vitest";
import type { AdminOrder } from "@/lib/admin/types";
import { listShopCustomerOrders } from "@/lib/shop/customer-orders";

vi.mock("@/lib/admin/store", () => ({
  loadStoreReadOnly: vi.fn(),
  patchOrder: vi.fn().mockResolvedValue({ order: null, changed: true }),
}));

const baseOrder = (overrides: Partial<AdminOrder> = {}): AdminOrder => ({
  id: "PP-1",
  customerName: "Ada",
  email: "buyer@dingry.test",
  total: 120,
  items: ["Hoodie ×1"],
  status: "Payée",
  createdAt: "2026-01-02T10:00:00.000Z",
  source: "paypal",
  ...overrides,
});

describe("listShopCustomerOrders", () => {
  it("retourne les commandes PayPal au même e-mail ou liées par userId", async () => {
    const store = await import("@/lib/admin/store");
    vi.mocked(store.loadStoreReadOnly).mockResolvedValue({
      version: 1,
      products: [],
      lookbook: [],
      orders: [
        baseOrder(),
        baseOrder({
          id: "PP-2",
          email: "other@dingry.test",
          supabaseUserId: "user-xyz",
        }),
        baseOrder({
          id: "PP-3",
          supabaseUserId: "user-abc",
          email: "buyer@dingry.test",
        }),
        baseOrder({ id: "DEMO-1", source: "demo" }),
      ],
      removedCatalogIds: [],
    });

    const orders = await listShopCustomerOrders("user-abc", "buyer@dingry.test");
    expect(orders.map((o) => o.id).sort()).toEqual(["PP-1", "PP-3"]);
  });
});
