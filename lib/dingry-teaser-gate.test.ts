import { afterEach, describe, expect, it, vi } from "vitest";
import { isTeaserGateActive, isTeaserGatedPath } from "@/lib/dingry-teaser-gate";

describe("isTeaserGateActive", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("actif si variable absente", () => {
    vi.stubEnv("DINGRY_TEASER_GATE", "");
    expect(isTeaserGateActive()).toBe(true);
  });

  it("actif sur faute de frappe", () => {
    vi.stubEnv("DINGRY_TEASER_GATE", "of");
    expect(isTeaserGateActive()).toBe(true);
  });

  it("inactif uniquement sur désactivation explicite", () => {
    for (const value of ["off", "0", "false", "disabled", "OFF"]) {
      vi.stubEnv("DINGRY_TEASER_GATE", value);
      expect(isTeaserGateActive()).toBe(false);
    }
  });

  it("reste actif sur valeur inconnue", () => {
    vi.stubEnv("DINGRY_TEASER_GATE", "open");
    expect(isTeaserGateActive()).toBe(true);
  });
});

describe("isTeaserGatedPath", () => {
  it("checkout/success et cancel publics", () => {
    expect(isTeaserGatedPath("/checkout/success")).toBe(false);
    expect(isTeaserGatedPath("/checkout/cancel")).toBe(false);
    expect(isTeaserGatedPath("/checkout")).toBe(true);
  });
});
