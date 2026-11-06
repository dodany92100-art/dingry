import { describe, expect, it } from "vitest";
import { normalizePantWaistSize } from "@/lib/admin/pant-waist";
import { isProductSize } from "@/lib/admin/types";

describe("pant waist", () => {
  it("accepts presets and custom tours in range", () => {
    expect(normalizePantWaistSize("46")).toBe("46");
    expect(normalizePantWaistSize("33")).toBe("33");
    expect(normalizePantWaistSize("54")).toBe("54");
    expect(normalizePantWaistSize("23")).toBeNull();
    expect(normalizePantWaistSize("55")).toBeNull();
  });

  it("isProductSize accepts custom pant waists", () => {
    expect(isProductSize("33")).toBe(true);
    expect(isProductSize("46")).toBe(true);
    expect(isProductSize("M")).toBe(true);
  });
});
