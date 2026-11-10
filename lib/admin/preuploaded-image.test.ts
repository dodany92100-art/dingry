import { describe, expect, it } from "vitest";
import { persoBannerImageFromForm } from "@/lib/admin/preuploaded-image";

describe("persoBannerImageFromForm", () => {
  it("rejette Cloudinary", () => {
    const form = new FormData();
    form.set("imageUrl", "https://res.cloudinary.com/demo/image/upload/banner.webp");
    expect(persoBannerImageFromForm(form)).toBeNull();
  });

  it("accepte une URL R2 persistée", () => {
    const form = new FormData();
    form.set("imageUrl", "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/banner/x.webp");
    form.set("imageBlobPathname", "dingry/banner/x.webp");
    const payload = persoBannerImageFromForm(form);
    expect(payload?.blobPathname).toBe("dingry/banner/x.webp");
  });
});
