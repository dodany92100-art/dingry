import { describe, expect, it } from "vitest";
import { buildShippingLabelQrPayload, extractSkuFromOrderLine } from "@/lib/admin/shipping-label-qr";
import type { AdminOrder } from "@/lib/admin/types";

const baseOrder: AdminOrder = {
  id: "PAY-1",
  customerName: "Test",
  email: "a@b.fr",
  total: 100,
  items: [],
  status: "Payée",
  createdAt: "2026-01-01T00:00:00.000Z",
  source: "paypal",
};

describe("shipping-label-qr", () => {
  it("extrait le SKU en suffixe de ligne", () => {
    expect(
      extractSkuFromOrderLine("HOODIE SIGNATURE / VERT TEAL — RECTO — S ×2 · DINGRY-H02"),
    ).toBe("DINGRY-H02");
  });

  it("inclut sku et lignes dans le payload", () => {
    const payload = JSON.parse(
      buildShippingLabelQrPayload({
        ...baseOrder,
        items: ["JERSEY ROCKSTAR / WHITE — BLANC — S ×1 · DINGRY-J01"],
      }),
    ) as { items: { sku: string; line: string }[] };
    expect(payload.items[0]?.sku).toBe("DINGRY-J01");
    expect(payload.items[0]?.line).toContain("JERSEY ROCKSTAR");
  });
});