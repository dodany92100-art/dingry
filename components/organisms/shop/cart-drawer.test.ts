import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  CART_DRAWER_DECORATIVE_IMG,
  DINGRY_CART_DRAWER_TITLE_ID,
} from "@/components/organisms/shop/cart-drawer";
import {
  resolveShopOverlayTabFocus,
  shouldTrapShopOverlayTab,
} from "@/components/organisms/shop/shop-overlay-focus-trap";

const drawerPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "cart-drawer.tsx");

describe("cart-drawer (MWG)", () => {
  it("expose un id de titre pour aria-labelledby", () => {
    expect(DINGRY_CART_DRAWER_TITLE_ID).toBe("dingry-cart-drawer-title");
  });

  it("dépriorise l'image décorative", () => {
    expect(CART_DRAWER_DECORATIVE_IMG).toEqual({
      loading: "lazy",
      fetchPriority: "low",
      decoding: "async",
    });
  });

  it("déclare role=dialog et aria-modal sur le panneau", () => {
    const source = readFileSync(drawerPath, "utf8");
    expect(source).toMatch(/role="dialog"/);
    expect(source).toMatch(/aria-modal="true"/);
    expect(source).toMatch(/aria-labelledby=\{DINGRY_CART_DRAWER_TITLE_ID\}/);
  });
});

describe("resolveShopOverlayTabFocus (panier)", () => {
  const a = { id: "a" } as unknown as HTMLElement;
  const b = { id: "b" } as unknown as HTMLElement;
  const c = { id: "c" } as unknown as HTMLElement;
  const focusables = [a, b, c];

  it("boucle vers le premier sur Tab depuis le dernier", () => {
    expect(resolveShopOverlayTabFocus("next", focusables, c)).toBe(a);
    expect(shouldTrapShopOverlayTab("next", focusables, c)).toBe(true);
  });

  it("boucle vers le dernier sur Maj+Tab depuis le premier", () => {
    expect(resolveShopOverlayTabFocus("prev", focusables, a)).toBe(c);
    expect(shouldTrapShopOverlayTab("prev", focusables, a)).toBe(true);
  });

  it("laisse Tab avancer au milieu de la liste", () => {
    expect(resolveShopOverlayTabFocus("next", focusables, a)).toBe(b);
    expect(shouldTrapShopOverlayTab("next", focusables, a)).toBe(false);
  });
});