import { describe, expect, it } from "vitest";
import { sanitizeAuthCallbackNext } from "@/lib/auth/auth-callback-next";

describe("sanitizeAuthCallbackNext", () => {
  it("accepte /websitedx", () => {
    expect(sanitizeAuthCallbackNext("/websitedx")).toBe("/websitedx");
  });

  it("refuse admin et open redirect", () => {
    expect(sanitizeAuthCallbackNext("/admin")).toBe("/websitedx");
    expect(sanitizeAuthCallbackNext("//evil.com")).toBe("/websitedx");
  });
});
