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

  it("rejette custom_id absent", () => {
    expect(readVerifiedPayment(completedOrder(undefined), quote)).toBeNull();
  });

  it("rejette custom_id vide", () => {
    expect(readVerifiedPayment(completedOrder(""), quote)).toBeNull();
  });

  it("rejette un digest différent", () => {
    expect(readVerifiedPayment(completedOrder("b".repeat(64)), quote)).toBeNull();
  });

  it("rejette un montant PayPal différent du devis", () => {
    const order = completedOrder(digest);
    order.purchase_units![0].amount!.value = "49.00";
    order.purchase_units![0].payments!.captures![0].amount!.value = "49.00";
    expect(readVerifiedPayment(order, quote)).toBeNull();
  });
});
