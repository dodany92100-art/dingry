import { describe, expect, it } from "vitest";
import { normalizeCustomerPhone } from "@/lib/checkout-phone";

describe("normalizeCustomerPhone", () => {
  it("accepte un mobile FR avec espaces", () => {
    expect(normalizeCustomerPhone("06 12 34 56 78")).toBe("0612345678");
  });

  it("accepte +33", () => {
    expect(normalizeCustomerPhone("+33612345678")).toBe("+33612345678");
  });

  it("refuse trop court", () => {
    expect(normalizeCustomerPhone("0612")).toBeNull();
  });
});
