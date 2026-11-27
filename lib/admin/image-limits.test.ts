import { describe, expect, it } from "vitest";
import { CRM_CONTENT_IMAGE_MAX_BYTES } from "@/lib/admin/image-limits";
import { validateCrmContentImageFile } from "@/lib/admin/store";

describe("validateCrmContentImageFile", () => {
  it("refuse au-delà de 8 Mo (WebP converti)", () => {
    const file = new File([new Uint8Array(CRM_CONTENT_IMAGE_MAX_BYTES + 1)], "x.webp", {
      type: "image/webp",
    });
    expect(validateCrmContentImageFile(file)).toContain("8 Mo");
  });

  it("accepte un WebP sous 8 Mo", () => {
    const file = new File([new Uint8Array(1024)], "x.webp", { type: "image/webp" });
    expect(validateCrmContentImageFile(file)).toBeNull();
  });
});