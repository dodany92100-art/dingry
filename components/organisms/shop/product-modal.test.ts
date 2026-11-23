import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  DINGRY_PRODUCT_MODAL_TITLE_ID,
  PRODUCT_MODAL_DECORATIVE_IMG,
  resolveProductModalTabFocus,
  shouldTrapProductModalTab,
} from "@/components/organisms/shop/product-modal";

const modalPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "product-modal.tsx");

describe("product-modal (MWG)", () => {
  it("expose un id de titre pour aria-labelledby", () => {
    expect(DINGRY_PRODUCT_MODAL_TITLE_ID).toBe("dingry-product-modal-title");
  });

  it("dépriorise les images décoratives", () => {
    expect(PRODUCT_MODAL_DECORATIVE_IMG).toEqual({
      loading: "lazy",
      fetchPriority: "low",
      decoding: "async",
    });
  });

  it("déclare role=dialog et aria-modal sur le panneau", () => {
    const source = readFileSync(modalPath, "utf8");
    expect(source).toMatch(/role="dialog"/);
    expect(source).toMatch(/aria-modal="true"/);
    expect(source).toMatch(/aria-labelledby=\{DINGRY_PRODUCT_MODAL_TITLE_ID\}/);
  });
});

describe("resolveProductModalTabFocus", () => {
  const a = { id: "a" } as unknown as HTMLElement;
  const b = { id: "b" } as unknown as HTMLElement;
  const c = { id: "c" } as unknown as HTMLElement;
  const focusables = [a, b, c];

  it("boucle vers le premier sur Tab depuis le dernier", () => {
    expect(resolveProductModalTabFocus("next", focusables, c)).toBe(a);
    expect(shouldTrapProductModalTab("next", focusables, c)).toBe(true);
  });

  it("boucle vers le dernier sur Maj+Tab depuis le premier", () => {
    expect(resolveProductModalTabFocus("prev", focusables, a)).toBe(c);
    expect(shouldTrapProductModalTab("prev", focusables, a)).toBe(true);
  });

  it("laisse Tab avancer au milieu de la liste", () => {
    expect(resolveProductModalTabFocus("next", focusables, a)).toBe(b);
    expect(shouldTrapProductModalTab("next", focusables, a)).toBe(false);
  });

  it("focus initial : premier élément sur Tab sans focus connu", () => {
    expect(resolveProductModalTabFocus("next", focusables, null)).toBe(a);
    expect(shouldTrapProductModalTab("next", focusables, null)).toBe(true);
  });
});