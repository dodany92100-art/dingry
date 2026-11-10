import { describe, expect, it } from "vitest";
import { validateCrmContentImageFile } from "@/lib/admin/store";

describe("validateCrmContentImageFile", () => {
  it("refuse au-delà de 1 Mo", () => {
    const file = new File([new Uint8Array(1024 * 1024 + 1)], "x.webp", { type: "image/webp" });
    expect(validateCrmContentImageFile(file)).toContain("1 Mo");
  });

  it("accepte un WebP sous 1 Mo", () => {
    const file = new File([new Uint8Array(1024)], "x.webp", { type: "image/webp" });
    expect(validateCrmContentImageFile(file)).toBeNull();
  });
});
