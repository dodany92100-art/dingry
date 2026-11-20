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

  it("gate actif + /websitedx → fetch catalogue (cookie httpOnly)", () => {
    vi.stubEnv("NEXT_PUBLIC_DINGRY_TEASER_GATE", "on");
    vi.stubGlobal("window", {
      location: { pathname: "/websitedx", hostname: "www.dingry.com" },
      document: { cookie: "" },
    } as Window);
    expect(shouldClientFetchGatedShopApi()).toBe(true);
    vi.unstubAllGlobals();
  });

});