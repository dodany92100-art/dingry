import { describe, expect, it } from "vitest";
import {
  paypalCaptureOrderId,
  paypalRefundAlertContext,
  paypalRefundAlertType,
} from "@/lib/paypal-webhook";

describe("paypalRefundAlertType", () => {
  it("accepte les types PayPal exacts", () => {
    expect(
      paypalRefundAlertType({ event_type: "PAYMENT.CAPTURE.REFUNDED", resource: { id: "c1" } }),
    ).toBe("PAYMENT.CAPTURE.REFUNDED");
    expect(
      paypalRefundAlertType({ event_type: "PAYMENT.CAPTURE.REVERSED", resource: { id: "c2" } }),
    ).toBe("PAYMENT.CAPTURE.REVERSED");
  });

  it("refuse une casse incorrecte", () => {
    expect(paypalRefundAlertType({ event_type: "PAYMENT.Capture.REFUNDED" })).toBeNull();
  });
});

describe("paypalRefundAlertContext", () => {
  it("extrait capture et commande", () => {
    expect(
      paypalRefundAlertContext({
        event_type: "PAYMENT.CAPTURE.REFUNDED",
        resource: {
          id: "CAP-1",
          supplementary_data: { related_ids: { order_id: "5O12345678901234" } },
        },
      }),
    ).toEqual({
      eventType: "PAYMENT.CAPTURE.REFUNDED",
      captureId: "CAP-1",
      orderId: "5O12345678901234",
    });
  });
});

describe("paypalCaptureOrderId", () => {
  it("ignore les autres événements", () => {
    expect(paypalCaptureOrderId({ event_type: "PAYMENT.CAPTURE.REFUNDED" })).toBe("ignore");
  });
});
