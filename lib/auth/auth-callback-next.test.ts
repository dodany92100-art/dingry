import { describe, expect, it } from "vitest";
import { sanitizeAuthCallbackNext } from "@/lib/auth/auth-callback-next";

describe("sanitizeAuthCallbackNext", () => {
  it("accepte /websitedx", () => {
    expect(sanitizeAuthCallbackNext("/websitedx")).toBe("/websitedx");
  });

  it("refuse admin et open redirect", () => {
    expect(sanitizeAuthCallbackNext("/admin")).toBe("/websitedx");
    expect(sanitizeAuthCallbackNext("/%61dmin")).toBe("/websitedx");
    expect(sanitizeAuthCallbackNext("//evil.com")).toBe("/websitedx");
    expect(sanitizeAuthCallbackNext("/\\evil.com")).toBe("/websitedx");
    expect(sanitizeAuthCallbackNext("/%2f%2fevil.com")).toBe("/websitedx");
    expect(sanitizeAuthCallbackNext("https://evil.com")).toBe("/websitedx");
    expect(sanitizeAuthCallbackNext("/websitedx/../admin")).toBe("/websitedx");
    expect(sanitizeAuthCallbackNext("javascript:alert(1)")).toBe("/websitedx");
    expect(sanitizeAuthCallbackNext("/\tevil.com")).toBe("/websitedx");
    expect(sanitizeAuthCallbackNext("/\n/evil.com")).toBe("/websitedx");
    expect(sanitizeAuthCallbackNext("/auth/callback")).toBe("/websitedx");
  });
});
