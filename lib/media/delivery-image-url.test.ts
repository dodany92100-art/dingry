import { describe, expect, it } from "vitest";
import { deliveryImageUrl } from "@/lib/media/delivery-image-url";

describe("deliveryImageUrl", () => {
  it("laisse passer une URL R2", () => {
    const url =
      "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/products/6/recto/x.webp";
    expect(deliveryImageUrl(url)).toContain(".r2.dev");
  });

  it("ne transforme pas une URL locale", () => {
    expect(deliveryImageUrl("/dingry-draft-product.svg")).toBe("/dingry-draft-product.svg");
  });
});
