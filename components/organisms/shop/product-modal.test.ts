import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  DINGRY_PRODUCT_MODAL_TITLE_ID,
  PRODUCT_MODAL_DECORATIVE_IMG,
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