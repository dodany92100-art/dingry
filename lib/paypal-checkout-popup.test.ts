import { describe, expect, it } from "vitest";
import { PAYPAL_CHECKOUT_MSG, parsePayPalCheckoutPopupEvent } from "@/lib/paypal-checkout-popup";

describe("parsePayPalCheckoutPopupEvent", () => {
  it("accepte l'approbation avec un id PayPal valide", () => {
    const id = "8AB12345CD678901E";
    expect(parsePayPalCheckoutPopupEvent({ type: PAYPAL_CHECKOUT_MSG.approved, orderId: id })).toEqual({
      type: PAYPAL_CHECKOUT_MSG.approved,
      orderId: id,
    });
  });

  it("rejette un id invalide", () => {
    expect(parsePayPalCheckoutPopupEvent({ type: PAYPAL_CHECKOUT_MSG.approved, orderId: "x" })).toBeNull();
  });

  it("accepte l'annulation", () => {
    expect(parsePayPalCheckoutPopupEvent({ type: PAYPAL_CHECKOUT_MSG.cancelled })).toEqual({
      type: PAYPAL_CHECKOUT_MSG.cancelled,
    });
  });
});