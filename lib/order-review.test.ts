import { describe, expect, it } from "vitest";
import type { AdminOrder } from "@/lib/admin/types";
import {
  formatReviewReasons,
  isShippingAddressMissing,
  mergeReviewReasons,
  patchForReviewReason,
  resolveReviewReason,
} from "@/lib/order-review";

const baseOrder = (overrides: Partial<AdminOrder> = {}): AdminOrder => ({
  id: "o1",
  customerName: "Test",
  email: "t@test.com",
  total: 10,
  items: [],
  status: "Payée",
  createdAt: new Date().toISOString(),
  source: "paypal",
  ...overrides,
});

describe("mergeReviewReasons", () => {
  it("cumule stock et adresse", () => {
    expect(mergeReviewReasons(["stock"], "adresse")).toEqual(["stock", "adresse"]);
    expect(mergeReviewReasons(["adresse"], "stock")).toEqual(["stock", "adresse"]);
  });
});

describe("patchForReviewReason", () => {
  it("depuis Payée", () => {
    expect(patchForReviewReason(baseOrder(), "adresse")).toEqual({
      status: "À vérifier",
      reviewReasons: ["adresse"],
    });
  });

  it("depuis À vérifier ne change pas le statut", () => {
    expect(
      patchForReviewReason(baseOrder({ status: "À vérifier", reviewReasons: ["adresse"] }), "stock"),
    ).toEqual({ reviewReasons: ["stock", "adresse"] });
  });

  it("depuis Expédié ne rétrograde pas", () => {
    expect(patchForReviewReason(baseOrder({ status: "Expédiée" }), "stock")).toEqual({
      reviewReasons: ["stock"],
    });
  });
});

describe("isShippingAddressMissing", () => {
  it("détecte vide ou espaces", () => {
    expect(isShippingAddressMissing(undefined)).toBe(true);
    expect(isShippingAddressMissing("  ")).toBe(true);
    expect(isShippingAddressMissing("12 rue X, Paris")).toBe(false);
  });
});

describe("formatReviewReasons", () => {
  it("affiche les motifs", () => {
    expect(formatReviewReasons(["stock", "adresse"])).toBe("stock · adresse");
  });
});

describe("resolveReviewReason", () => {
  it("refuse stock sans stockApplied", () => {
    expect(
      resolveReviewReason(
        baseOrder({ status: "À vérifier", reviewReasons: ["stock"], stockApplied: false }),
        "stock",
      ),
    ).toEqual({});
  });

  it("refuse adresse sans shippingAddress", () => {
    expect(
      resolveReviewReason(
        baseOrder({ status: "À vérifier", reviewReasons: ["adresse"] }),
        "adresse",
      ),
    ).toEqual({});
  });

  it("passe en Payée quand le dernier motif est levé", () => {
    expect(
      resolveReviewReason(
        baseOrder({
          status: "À vérifier",
          reviewReasons: ["adresse"],
          shippingAddress: "12 rue X",
          stockApplied: true,
        }),
        "adresse",
      ),
    ).toEqual({ reviewReasons: undefined, status: "Payée" });
  });
});
