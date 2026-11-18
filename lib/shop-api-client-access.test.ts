import { describe, expect, it, vi } from "vitest";
import { isTeaserGateActiveClient, shouldClientFetchGatedShopApi } from "@/lib/shop-api-client-access";

describe("shop-api-client-access", () => {
  it("teaser gate actif par défaut côté client", () => {
    vi.stubEnv("NEXT_PUBLIC_DINGRY_TEASER_GATE", "");
    expect(isTeaserGateActiveClient()).toBe(true);
  });

  it("teaser gate off via NEXT_PUBLIC", () => {
    vi.stubEnv("NEXT_PUBLIC_DINGRY_TEASER_GATE", "off");
    expect(isTeaserGateActiveClient()).toBe(false);
    expect(shouldClientFetchGatedShopApi()).toBe(true);
  });

});