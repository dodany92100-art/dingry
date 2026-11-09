import { describe, expect, it } from "vitest";
import { buildCloudinaryPictureSet, cldOpt } from "@/lib/cloudinary-url";

const SAMPLE =
  "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793122066/HOODIE_DINGRY_RECTO.png";

describe("cloudinary-url", () => {
  it("cldOpt injecte f_auto", () => {
    const out = cldOpt(SAMPLE, 480);
    expect(out).toContain("f_auto,q_auto:good,w_480");
    expect(out).toContain("/v1793122066/");
  });

  it("buildCloudinaryPictureSet — avif, webp, jpg", () => {
    const set = buildCloudinaryPictureSet(SAMPLE, 480);
    expect(set).not.toBeNull();
    expect(set!.avif).toContain("f_avif");
    expect(set!.webp).toContain("f_webp");
    expect(set!.fallback).toContain("f_jpg");
  });

  it("URL non Cloudinary → null", () => {
    expect(buildCloudinaryPictureSet("https://pub.r2.dev/foo.webp", 480)).toBeNull();
  });
});
