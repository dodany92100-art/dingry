import { describe, expect, it } from "vitest";
import {
  encodePersoBannerFocusLink,
  parsePersoBannerFocusFromLink,
} from "@/lib/catalog-perso-banner-focus";

describe("catalog-perso-banner-focus", () => {
  it("encode / parse link_url Supabase", () => {
    const link = encodePersoBannerFocusLink(62, 28);
    expect(link).toBe("dingry:image-focus:62,28");
    expect(parsePersoBannerFocusFromLink(link)).toEqual({ imageFocusX: 62, imageFocusY: 28 });
  });

  it("défaut si link_url vide", () => {
    expect(parsePersoBannerFocusFromLink("")).toEqual({ imageFocusX: 50, imageFocusY: 40 });
  });
});
