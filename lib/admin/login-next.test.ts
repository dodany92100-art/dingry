import { describe, expect, it } from "vitest";
import { sanitizeAdminLoginNext } from "@/lib/admin/login-next";

describe("sanitizeAdminLoginNext", () => {
  it("whitelist exacte", () => {
    expect(sanitizeAdminLoginNext("/websitedx")).toBe("/websitedx");
    expect(sanitizeAdminLoginNext("/checkout")).toBe("/checkout");
  });

  it("défaut admin", () => {
    expect(sanitizeAdminLoginNext(null)).toBe("/admin");
    expect(sanitizeAdminLoginNext("/checkout/success")).toBe("/admin");
    expect(sanitizeAdminLoginNext("/checkout/success?token=bad")).toBe("/admin");
    expect(sanitizeAdminLoginNext("/checkout/success?token=5R989080W42399034")).toBe(
      "/checkout/success?token=5R989080W42399034",
    );
    expect(sanitizeAdminLoginNext("/admin")).toBe("/admin");
  });

  it("rejette externes et traversal", () => {
    expect(sanitizeAdminLoginNext("//evil.com")).toBe("/admin");
    expect(sanitizeAdminLoginNext("https://evil.com")).toBe("/admin");
    expect(sanitizeAdminLoginNext("/..%2fadmin")).toBe("/admin");
    expect(sanitizeAdminLoginNext("/websitedx%00")).toBe("/admin");
  });

  it("rejette encodages dangereux après decode", () => {
    expect(sanitizeAdminLoginNext("%2f%2fevil.com")).toBe("/admin");
    expect(sanitizeAdminLoginNext("%5c%5cevil")).toBe("/admin");
  });
});
