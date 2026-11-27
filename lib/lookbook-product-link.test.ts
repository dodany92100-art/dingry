import { describe, expect, it } from "vitest";
import { parseLookbookProductId } from "@/lib/lookbook-product-link";

describe("parseLookbookProductId", () => {
  it("lit product:id et id seul", () => {
    expect(parseLookbookProductId("product:12")).toBe(12);
    expect(parseLookbookProductId("Product: 7")).toBe(7);
    expect(parseLookbookProductId("99")).toBe(99);
  });

  it("ignore légendes libres", () => {
    expect(parseLookbookProductId("Par Sully Sefil")).toBeNull();
    expect(parseLookbookProductId("")).toBeNull();
  });
});