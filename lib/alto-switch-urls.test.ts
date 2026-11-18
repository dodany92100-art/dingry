import { describe, expect, it, vi } from "vitest";
import {
  altoAbsolutePublicUrl,
  altoCrmAdminUrl,
  altoShopEntryUrl,
  isAltoHostSplitEnabled,
  isWebsitedxPath,
} from "./alto-switch-urls";

describe("alto-switch-urls", () => {
  it("détecte /websitedx", () => {
    expect(isWebsitedxPath("/websitedx")).toBe(true);
    expect(isWebsitedxPath("/websitedx/foo")).toBe(true);
    expect(isWebsitedxPath("/")).toBe(false);
  });

  it("construit les URLs absolues avec split", () => {
    vi.stubEnv("NEXT_PUBLIC_DINGRY_SHOP_PREVIEW_URL", "https://www.dingry.com");
    vi.stubEnv("NEXT_PUBLIC_DINGRY_CRM_URL", "https://crm.dingry.com");
    expect(isAltoHostSplitEnabled()).toBe(true);
    expect(altoShopEntryUrl()).toBe("https://www.dingry.com/websitedx");
    expect(altoCrmAdminUrl()).toBe("https://crm.dingry.com/admin");
    expect(altoAbsolutePublicUrl("/websitedx?x=1")).toBe("https://www.dingry.com/websitedx?x=1");
  });
});