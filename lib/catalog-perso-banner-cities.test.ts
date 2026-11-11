import { describe, expect, it } from "vitest";
import { encodePersoBannerLink, parsePersoBannerLinkMeta } from "@/lib/catalog-perso-banner-cities";

describe("catalog-perso-banner-cities link", () => {
  it("legacy focus link", () => {
    expect(parsePersoBannerLinkMeta("dingry:image-focus:55,35")).toMatchObject({
      imageFocusX: 55,
      imageFocusY: 35,
      cityVisuals: {},
    });
  });

  it("encode et parse les villes", () => {
    const link = encodePersoBannerLink(50, 40, {
      paris: {
        imageUrl: "https://cdn.example/paris.webp",
        blobPathname: "p/paris.webp",
        imageFocusX: 48,
        imageFocusY: 42,
      },
    });
    const meta = parsePersoBannerLinkMeta(link);
    expect(meta.imageFocusX).toBe(50);
    expect(meta.cityVisuals.paris?.imageUrl).toBe("https://cdn.example/paris.webp");
    expect(meta.cityVisuals.paris?.imageFocusY).toBe(42);
  });
});
