import { describe, expect, it } from "vitest";
import { detectPlannedShippingTier, plannedShippingForOrder } from "@/lib/admin/planned-shipping";
import type { AdminOrder } from "@/lib/admin/types";

const base: AdminOrder = {
  id: "x",
  customerName: "a",
  email: "a@b.fr",
  total: 10,
  items: [],
  status: "Payée",
  createdAt: "",
  source: "paypal",
};

describe("planned-shipping", () => {
  it("détecte la France", () => {
    expect(detectPlannedShippingTier("36 rue test, 93300 Aubervilliers, FR")).toBe("fr");
  });

  it("retourne un montant pour FR", () => {
    const q = plannedShippingForOrder({
      ...base,
      shippingAddress: "Paris, FR",
    });
    expect(q.tier).toBe("fr");
    expect(q.amountEur).toBe(6.9);
  });
});