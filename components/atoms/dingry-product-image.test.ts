import { describe, expect, it } from "vitest";
import { resolveProductImageSrc } from "@/components/atoms/dingry-product-image";

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