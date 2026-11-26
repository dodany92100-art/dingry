import { describe, expect, it } from "vitest";
import { resolveShopHeroSlideImageUrl } from "@/lib/shop-hero-media";

describe("shop-hero-media", () => {
  it("override CRM prioritaire sur défaut", () => {
    const url = resolveShopHeroSlideImageUrl("collection", "/default.webp", {
      collection: "https://cdn.test/hero.webp",
    });
    expect(url).toBe("https://cdn.test/hero.webp");
  });

  it("lookbook dynamique lit lookbook-hero", () => {
    const url = resolveShopHeroSlideImageUrl("lookbook-99", "/look.webp", {
      "lookbook-hero": "https://cdn.test/lb.webp",
    });
    expect(url).toBe("https://cdn.test/lb.webp");
  });
});