import { describe, expect, it } from "vitest";
import type { CheckoutQuote } from "@/lib/checkout-quote";
import { readVerifiedPayment } from "@/lib/paypal-server";

const digest = "a".repeat(64);

const quote: CheckoutQuote = {
  lines: [{ productId: 11, size: "M", qty: 1 }],
  totalCents: 5000,
  currency: "EUR",
  items: ["T ×1"],
  paypalItems: [],
  digest,
};

function completedOrder(customId: string | undefined) {
  return {
    id: "ORDER-ABC",
    status: "COMPLETED",
    payer: { email_address: "buyer@example.com", name: { given_name: "A", surname: "B" } },
    purchase_units: [
      {
        custom_id: customId,
        amount: { currency_code: "EUR", value: "50.00" },
        payments: {
          captures: [
            {
              id: "CAP-1",
              status: "COMPLETED",
              amount: { currency_code: "EUR", value: "50.00" },
            },
          ],
        },
        shipping: {
          name: { full_name: "A B" },
          address: {
            address_line_1: "1 rue Test",
            postal_code: "75001",
            admin_area_2: "Paris",
            country_code: "FR",
          },
        },
      },
    ],
  };
}

describe("readVerifiedPayment", () => {
  it("accepte custom_id égal au digest du devis", () => {
    const payment = readVerifiedPayment(completedOrder(digest), quote);
    expect(payment?.orderId).toBe("ORDER-ABC");
    expect(payment?.totalCents).toBe(5000);
  });

  it("accepte custom_id absent si le montant correspond (GET PayPal)", () => {
    const payment = readVerifiedPayment(completedOrder(undefined), quote);
    expect(payment?.orderId).toBe("ORDER-ABC");
  });

  it("rejette un digest différent", () => {
    expect(readVerifiedPayment(completedOrder("b".repeat(64)), quote)).toBeNull();
  });

  it("accepte si seule la capture correspond (unit.amount divergent)", () => {
    const order = completedOrder(digest);
    const unit = order.purchase_units?.[0];
    const capture = unit?.payments?.captures?.[0];
    if (!unit?.amount || !capture?.amount) throw new Error("fixture PayPal incomplète");
    unit.amount.value = "49.00";
    capture.amount.value = "50.00";
    expect(readVerifiedPayment(order, quote)?.totalCents).toBe(5000);
  });

  it("rejette un montant PayPal différent du devis", () => {
    const order = completedOrder(digest);
    const unit = order.purchase_units?.[0];
    const capture = unit?.payments?.captures?.[0];
    if (!unit?.amount || !capture?.amount) throw new Error("fixture PayPal incomplète");
    unit.amount.value = "49.00";
    capture.amount.value = "49.00";
    expect(readVerifiedPayment(order, quote)).toBeNull();
  });
});
