import { describe, expect, it } from "vitest";
import { shopBasePathFromPathname, shopHref } from "@/lib/shop-base-path";

describe("shopBasePathFromPathname", () => {
  it("détecte /websitedx", () => {
    expect(shopBasePathFromPathname("/websitedx")).toBe("/websitedx");
    expect(shopBasePathFromPathname("/websitedx/")).toBe("/websitedx");
  });

  it("défaut /", () => {
    expect(shopBasePathFromPathname("/")).toBe("/");
    expect(shopBasePathFromPathname("/checkout")).toBe("/");
  });
});

describe("shopHref", () => {
  it("préfixe en preview", () => {
    expect(shopHref("/websitedx", "/")).toBe("/websitedx");
    expect(shopHref("/websitedx", "/checkout")).toBe("/checkout");
  });

  it("laisse inchangé sur /", () => {
    expect(shopHref("/", "/checkout")).toBe("/checkout");
  });
});
