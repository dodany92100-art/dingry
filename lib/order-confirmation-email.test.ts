import { describe, expect, it, vi, beforeEach } from "vitest";
import type { AdminOrder } from "@/lib/admin/types";
import type { CheckoutQuote } from "@/lib/checkout-quote";
import type { VerifiedPayPalPayment } from "@/lib/paypal-server";
import * as orderConfirmation from "@/lib/order-confirmation-email";
import {
  buildOrderConfirmationLines,
  confirmationSentRedisKey,
  CUSTOMER_ORDER_CONFIRMATION_PERSIST_TIMEOUT_MS,
  escapeHtml,
  renderOrderConfirmationHtml,
  sendCustomerOrderConfirmation,
} from "@/lib/order-confirmation-email";

const payment: VerifiedPayPalPayment = {
  orderId: "ORD-99",
  captureId: "CAP-99",
  payerName: "Jean Dupont",
  email: "client@example.com",
  totalCents: 4000,
  currency: "EUR",
  shippingName: "Jean Dupont",
  shippingAddress: "10 rue de Paris, 75001 Paris, FR",
};

const baseOrder = (): AdminOrder => ({
  id: "ORD-99",
  customerName: "Jean Dupont",
  email: "client@example.com",
  total: 40,
  items: ["DINGRY TEE — M — Paris ×1"],
  status: "Payée",
  createdAt: "2026-11-12T10:00:00.000Z",
  source: "paypal",
  shippingName: "Jean Dupont",
  shippingAddress: "10 rue de Paris, 75001 Paris, FR",
});

vi.mock("@/lib/admin/store", () => ({
  loadStoreReadOnly: vi.fn(async () => ({
    products: [],
    orders: [],
    removedProductIds: [],
    catalogPersoBanner: null,
    atelierCustom: null,
    lookbook: [],
  })),
}));

vi.mock("@/lib/shop-catalog-snapshot", () => ({
  buildShopCatalogSnapshot: vi.fn(() => ({
    shopById: new Map(),
    adminById: new Map(),
    removed: new Set<number>(),
  })),
}));

vi.mock("@/lib/atelier-custom-server", () => ({
  loadPersonalizationProductIds: vi.fn(async () => [24]),
}));

vi.mock("@/lib/checkout-line-resolve", () => ({
  resolveCheckoutLine: vi.fn(),
}));

vi.mock("@/lib/ratelimit", () => ({
  getSharedRedis: vi.fn(),
}));

vi.mock("@/lib/ops-alert", () => ({
  sendResendEmail: vi.fn(),
  sendOpsAlertOnce: vi.fn(),
}));

describe("order-confirmation-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("échappe le HTML dans les textes client", () => {
    expect(escapeHtml(`<img onerror="x" src="y">`)).toBe(
      "&lt;img onerror=&quot;x&quot; src=&quot;y&quot;&gt;",
    );
    const html = renderOrderConfirmationHtml({
      order: { ...baseOrder(), customerName: '<b onload="evil">' },
      payment,
      lines: [{ kind: "fallback", text: "test" }],
    });
    expect(html).toContain("&lt;b onload=&quot;evil&quot;&gt;");
    expect(html).not.toContain("<b onload");
  });

  it("affiche ville perso, taille et adresse", async () => {
    const resolve = await import("@/lib/checkout-line-resolve");
    vi.mocked(resolve.resolveCheckoutLine).mockReturnValue({
      ok: true,
      line: {
        label: "TEE — Paris",
        paypalName: "TEE Paris",
        unitCents: 4000,
        qty: 1,
      },
    });

    const quote: CheckoutQuote = {
      lines: [{ productId: 24, size: "L", qty: 1, personalization: "Marseille" }],
      totalCents: 4000,
      currency: "EUR",
      items: ["TEE — Marseille — L ×1"],
      paypalItems: [],
      digest: "b".repeat(64),
    };

    const lines = await buildOrderConfirmationLines(baseOrder(), quote);
    expect(lines[0]?.kind).toBe("detailed");
    if (lines[0]?.kind === "detailed") {
      expect(lines[0].personalization).toBe("Marseille");
      expect(lines[0].size).toBe("L");
      expect(lines[0].showPersoSurcharge).toBe(true);
    }

    const html = renderOrderConfirmationHtml({ order: baseOrder(), payment, lines });
    expect(html).toContain("Marseille");
    expect(html).toContain("L");
    expect(html).toContain("10 rue de Paris");
  });

  it("repli sur items[] si resolve échoue", async () => {
    const resolve = await import("@/lib/checkout-line-resolve");
    vi.mocked(resolve.resolveCheckoutLine).mockReturnValue({ ok: false, reason: "removed" });

    const order: AdminOrder = {
      ...baseOrder(),
      items: ["Libellé stocké CRM"],
    };
    const quote: CheckoutQuote = {
      lines: [{ productId: 99, size: "M", qty: 1 }],
      totalCents: 1000,
      currency: "EUR",
      items: ["Libellé stocké CRM"],
      paypalItems: [],
      digest: "c".repeat(64),
    };

    const lines = await buildOrderConfirmationLines(order, quote);
    expect(lines).toEqual([{ kind: "fallback", text: "Libellé stocké CRM" }]);
    const html = renderOrderConfirmationHtml({ order, payment, lines });
    expect(html).toContain("Libellé stocké CRM");
    expect(html).not.toMatch(/Qté[\s\S]*?35,00\s*€/);
  });

  it("n’envoie pas si email absent et alerte ops", async () => {
    const ops = await import("@/lib/ops-alert");
    const quote: CheckoutQuote = {
      lines: [{ productId: 11, size: "M", qty: 1 }],
      totalCents: 1000,
      currency: "EUR",
      items: ["x"],
      paypalItems: [],
      digest: "d".repeat(64),
    };

    await sendCustomerOrderConfirmation({ ...baseOrder(), email: "—" }, payment, quote);
    expect(ops.sendResendEmail).not.toHaveBeenCalled();
    expect(ops.sendOpsAlertOnce).toHaveBeenCalledWith(
      "customer-email-missing:ORD-99",
      expect.any(String),
      expect.objectContaining({ orderId: "ORD-99" }),
    );
  });

  it("deuxième envoi bloqué par clé Redis", async () => {
    process.env.OPS_ALERT_FROM = "DINGRY <orders@dingry.com>";
    const redis = await import("@/lib/ratelimit");
    const ops = await import("@/lib/ops-alert");
    const redisSet = vi
      .fn()
      .mockResolvedValueOnce("OK")
      .mockResolvedValueOnce(null);
    const redisDel = vi.fn();
    vi.mocked(redis.getSharedRedis).mockReturnValue({
      set: redisSet,
      del: redisDel,
    } as unknown as ReturnType<typeof redis.getSharedRedis>);

    vi.mocked(ops.sendResendEmail).mockResolvedValue(true);

    const quote: CheckoutQuote = {
      lines: [{ productId: 11, size: "M", qty: 1 }],
      totalCents: 1000,
      currency: "EUR",
      items: ["x"],
      paypalItems: [],
      digest: "e".repeat(64),
    };

    await sendCustomerOrderConfirmation(baseOrder(), payment, quote);
    await sendCustomerOrderConfirmation(baseOrder(), payment, quote);

    expect(ops.sendResendEmail).toHaveBeenCalledTimes(1);
    expect(ops.sendResendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "DINGRY <orders@dingry.com>",
        replyTo: ["dingry@gmail.com"],
        bcc: ["dingry@gmail.com"],
      }),
    );
    expect(redisSet).toHaveBeenCalledWith(confirmationSentRedisKey("ORD-99"), "1", expect.objectContaining({ nx: true }));
  });

  it("timeout persist ne bloque pas (log + ops)", async () => {
    vi.useFakeTimers();
    const redis = await import("@/lib/ratelimit");
    const ops = await import("@/lib/ops-alert");
    const redisDel = vi.fn();
    vi.mocked(redis.getSharedRedis).mockReturnValue({
      set: vi.fn().mockResolvedValue("OK"),
      del: redisDel,
    } as unknown as ReturnType<typeof redis.getSharedRedis>);
    vi.mocked(ops.sendResendEmail).mockImplementation(() => new Promise(() => {}));
    process.env.OPS_ALERT_FROM = "DINGRY <orders@dingry.com>";

    const quote: CheckoutQuote = {
      lines: [{ productId: 11, size: "M", qty: 1 }],
      totalCents: 1000,
      currency: "EUR",
      items: ["x"],
      paypalItems: [],
      digest: "g".repeat(64),
    };

    const task = orderConfirmation.sendCustomerOrderConfirmationForPersist(baseOrder(), payment, quote);
    await vi.advanceTimersByTimeAsync(CUSTOMER_ORDER_CONFIRMATION_PERSIST_TIMEOUT_MS + 100);
    await task;

    expect(ops.sendOpsAlertOnce).toHaveBeenCalledWith(
      "customer-email-timeout:ORD-99",
      expect.any(String),
      expect.objectContaining({ orderId: "ORD-99" }),
    );
    expect(redisDel).not.toHaveBeenCalled();
  });

  it("rollback clé si Resend échoue", async () => {
    const redis = await import("@/lib/ratelimit");
    const ops = await import("@/lib/ops-alert");
    const redisDel = vi.fn();
    vi.mocked(redis.getSharedRedis).mockReturnValue({
      set: vi.fn().mockResolvedValue("OK"),
      del: redisDel,
    } as unknown as ReturnType<typeof redis.getSharedRedis>);
    vi.mocked(ops.sendResendEmail).mockResolvedValue(false);
    process.env.OPS_ALERT_FROM = "DINGRY <test@example.com>";

    const quote: CheckoutQuote = {
      lines: [{ productId: 11, size: "M", qty: 1 }],
      totalCents: 1000,
      currency: "EUR",
      items: ["x"],
      paypalItems: [],
      digest: "f".repeat(64),
    };

    await sendCustomerOrderConfirmation(baseOrder(), payment, quote);
    expect(redisDel).toHaveBeenCalledWith(confirmationSentRedisKey("ORD-99"));
    expect(ops.sendOpsAlertOnce).toHaveBeenCalledWith(
      "customer-email-failed:ORD-99",
      expect.any(String),
      expect.any(Object),
    );
  });
});
