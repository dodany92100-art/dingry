import { describe, expect, it } from "vitest";
import {
  DEFAULT_SHOP_VITRINE_AMBIENCE,
  normalizeShopVitrineAmbience,
  vitrineAmbienceObjectPosition,
} from "@/lib/shop-vitrine-ambience";

describe("shop-vitrine-ambience", () => {
  it("défaut stable", () => {
    expect(normalizeShopVitrineAmbience(null)).toEqual(DEFAULT_SHOP_VITRINE_AMBIENCE);
  });

  it("clamp focus et filtre URL", () => {
    const next = normalizeShopVitrineAmbience({
      imageUrl: "https://cdn.example/amb.webp",
      focusX: 120,
      focusY: -4,
    });
    expect(next.focusX).toBe(100);
    expect(next.focusY).toBe(0);
    expect(next.imageUrl).toBe("https://cdn.example/amb.webp");
    expect(vitrineAmbienceObjectPosition(next)).toBe("100% 0%");
  });

  it("rejette URL non sûre", () => {
    const next = normalizeShopVitrineAmbience({ imageUrl: "javascript:alert(1)" });
    expect(next.imageUrl).toBe(DEFAULT_SHOP_VITRINE_AMBIENCE.imageUrl);
  });
});