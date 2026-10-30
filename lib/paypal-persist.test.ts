import { describe, expect, it, vi } from "vitest";
import type { AdminOrder } from "@/lib/admin/types";
import type { CheckoutQuote } from "@/lib/checkout-quote";
import { persistPayPalPayment } from "@/lib/paypal-persist";
import type { VerifiedPayPalPayment } from "@/lib/paypal-server";

const quote: CheckoutQuote = {
  lines: [{ productId: 11, size: "M", qty: 1 }],
  totalCents: 1000,
  currency: "EUR",
  items: ["T ×1"],
  paypalItems: [],
  digest: "a".repeat(64),
};

const payment: VerifiedPayPalPayment = {
  orderId: "ORDER-1",
  captureId: "CAP-1",
  totalCents: 1000,
  payerName: "Test",
  email: "t@test.com",
  currency: "EUR",
  shippingName: "",
  shippingAddress: "",
};

const legacyOrder = (): AdminOrder => ({
  id: "ORDER-1",
  captureId: "CAP-1",
  customerName: "Test",
  email: "t@test.com",
  total: 10,
  items: quote.items,
  status: "En attente",
  createdAt: new Date().toISOString(),
  source: "paypal",
  stockPending: true,
  stockApplied: false,
});

vi.mock("@/lib/admin/store", () => ({
  findOrder: vi.fn(),
  insertOrderIfNew: vi.fn(),
  patchOrder: vi.fn(),
  StoreConflictError: class StoreConflictError extends Error {},
}));

vi.mock("@/lib/ratelimit", () => ({
  claimPayPalOrder: vi.fn(),
  completePayPalOrder: vi.fn(),
  readPayPalOrderMarker: vi.fn(),
  releasePayPalOrder: vi.fn(),
}));

vi.mock("@/lib/order-stock-finalize", () => ({
  finalizeOrderStock: vi.fn(async (order: AdminOrder) => order),
}));

vi.mock("@/lib/stock", async () => {
  const actual = await vi.importActual<typeof import("@/lib/stock")>("@/lib/stock");
  return {
    ...actual,
    applyCheckoutStock: vi.fn().mockResolvedValue("unavailable"),
  };
});

describe("persistPayPalPayment", () => {
  it("persiste stockLines sur commande legacy avant finalize", async () => {
    const store = await import("@/lib/admin/store");
    vi.mocked(store.findOrder).mockResolvedValue(legacyOrder());
    vi.mocked(store.patchOrder).mockResolvedValue({
      order: { ...legacyOrder(), stockLines: [{ productId: 11, qty: 1 }] },
      changed: true,
    });

    const result = await persistPayPalPayment(payment, quote);
    expect(result.ok).toBe(true);
    expect(store.patchOrder).toHaveBeenCalledWith("ORDER-1", expect.any(Function));
  });

  it("claim duplicate sans commande → 503", async () => {
    const store = await import("@/lib/admin/store");
    const ratelimit = await import("@/lib/ratelimit");
    vi.mocked(store.findOrder).mockResolvedValue(undefined);
    vi.mocked(ratelimit.claimPayPalOrder).mockResolvedValue({ status: "duplicate" });
    vi.mocked(ratelimit.readPayPalOrderMarker).mockResolvedValue("absent");

    const result = await persistPayPalPayment(payment, quote);
    expect(result).toEqual({ ok: false, status: 503, error: "Enregistrement indisponible." });
  });
});
