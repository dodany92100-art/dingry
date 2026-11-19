import { afterEach, describe, expect, it, vi } from "vitest";
import { fulfillmentOwnerEmail, isFulfillmentOwnerEmail } from "@/lib/shop/fulfillment-owner";

describe("fulfillmentOwnerEmail", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("utilise l’env si présent", () => {
    vi.stubEnv("DINGRY_FULFILLMENT_OWNER_EMAIL", "Ops@Example.COM");
    expect(fulfillmentOwnerEmail()).toBe("ops@example.com");
    expect(isFulfillmentOwnerEmail("ops@example.com")).toBe(true);
  });

  it("pas de défaut en déploiement production Vercel", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("DINGRY_FULFILLMENT_OWNER_EMAIL", "");
    expect(fulfillmentOwnerEmail()).toBe("");
    expect(isFulfillmentOwnerEmail("dingryofficiel@gmail.com")).toBe(false);
  });
});