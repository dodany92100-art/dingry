import { describe, expect, it } from "vitest";
import {
  resolveProductImageSrc,
  shouldFallbackOnMount,
  shouldHideBrokenImage,
} from "@/components/atoms/dingry-product-image";

describe("resolveProductImageSrc", () => {
  it("prend l’URL CRM quand elle est définie", () => {
    expect(resolveProductImageSrc("https://crm.example/a.webp", "https://fallback/b.webp")).toBe(
      "https://crm.example/a.webp",
    );
  });

  it("retombe sur le catalogue si la CRM est vide", () => {
    expect(resolveProductImageSrc("", "https://fallback/b.webp")).toBe("https://fallback/b.webp");
    expect(resolveProductImageSrc("  ", "https://fallback/b.webp")).toBe("https://fallback/b.webp");
  });

  it("utilise la CRM même si égale au repli", () => {
    const u = "https://cdn/same.webp";
    expect(resolveProductImageSrc(u, u)).toBe(u);
  });
});

describe("shouldFallbackOnMount", () => {
  const base = {
    complete: true,
    naturalWidth: 0,
    isFallback: false,
    hasFallback: true,
  };

  it("bascule si image CRM en échec au montage", () => {
    expect(shouldFallbackOnMount(base)).toBe(true);
  });

  it("ne bascule pas si l’image CRM est chargée", () => {
    expect(shouldFallbackOnMount({ ...base, naturalWidth: 120 })).toBe(false);
  });

  it("ne bascule pas si déjà sur le repli", () => {
    expect(shouldFallbackOnMount({ ...base, isFallback: true })).toBe(false);
  });

  it("ne bascule pas tant que le chargement n’est pas terminé", () => {
    expect(shouldFallbackOnMount({ ...base, complete: false })).toBe(false);
  });

  it("ne bascule pas sans repli distinct", () => {
    expect(shouldFallbackOnMount({ ...base, hasFallback: false })).toBe(false);
  });
});

describe("shouldHideBrokenImage", () => {
  it("masque si le repli est aussi en échec", () => {
    expect(
      shouldHideBrokenImage({
        complete: true,
        naturalWidth: 0,
        isFallback: true,
        hasFallback: true,
      }),
    ).toBe(true);
  });

  it("ne masque pas sur la CRM encore valide", () => {
    expect(
      shouldHideBrokenImage({
        complete: true,
        naturalWidth: 0,
        isFallback: false,
        hasFallback: true,
      }),
    ).toBe(false);
  });
});