import { describe, expect, it } from "vitest";
import {
  normalizeShopHeroSlideFraming,
  resolveShopHeroFraming,
  SHOP_HERO_SCALE_MAX,
} from "@/lib/shop-hero-framing";

describe("shop-hero-framing", () => {
  const defaults = { focalX: 50, focalY: 40, scale: 1 };

  it("clamp zoom", () => {
    expect(normalizeShopHeroSlideFraming({ scale: 9 }, defaults).scale).toBe(SHOP_HERO_SCALE_MAX);
  });

  it("lookbook dynamique hérite de lookbook-hero", () => {
    const map = { "lookbook-hero": { focalX: 48, focalY: 55, scale: 1.1 } };
    const resolved = resolveShopHeroFraming("lookbook-42", defaults, map);
    expect(resolved.focalY).toBe(55);
    expect(resolved.scale).toBe(1.1);
  });
});