import { describe, expect, it } from "vitest";
import { isClientAdminStorefrontAdjustPath } from "@/lib/admin/client-admin-session-probe";

describe("client-admin-session-probe", () => {
  it("cible vitrine et checkout", () => {
    expect(isClientAdminStorefrontAdjustPath("/websitedx")).toBe(true);
    expect(isClientAdminStorefrontAdjustPath("/websitedx/marque/dingry")).toBe(true);
    expect(isClientAdminStorefrontAdjustPath("/checkout")).toBe(true);
    expect(isClientAdminStorefrontAdjustPath("/admin")).toBe(false);
  });
});