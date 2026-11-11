import { describe, expect, it } from "vitest";
import { rowToAdminLookbookSlide } from "@/lib/supabase/lookbook-slides";
import { rowToAdminCatalogPersoBanner, rowToPublicShopBanner } from "@/lib/supabase/shop-banners";

describe("lookbook_slides row mapping", () => {
  it("mappe subtitle → caption admin", () => {
    const slide = rowToAdminLookbookSlide({
      id: "lb-1",
      title: "Rue",
      subtitle: "Editorial",
      image_url: "https://cdn.example/rue.webp",
      link_url: "",
      image_blob_pathname: "lookbook/lb-1.webp",
      display_order: 1,
      is_active: true,
      created_at: "2026-11-10T12:00:00.000Z",
      updated_at: "2026-11-10T12:00:00.000Z",
    });
    expect(slide.caption).toBe("Editorial");
    expect(slide.sortOrder).toBe(1);
    expect(slide.imageUrl).toBe("https://cdn.example/rue.webp");
  });
});

describe("shop_banners row mapping", () => {
  const sample = {
    id: "banner-1",
    title: "Ville",
    subtitle: "Tee perso",
    eyebrow: "Custom",
    cta_label: "CUSTOM",
    image_url: "https://cdn.example/banner.webp",
    link_url: "/custom",
    image_blob_pathname: "banner/perso.webp",
    position: "catalog_perso",
    is_active: true,
    created_at: "2026-11-10T12:00:00.000Z",
    updated_at: "2026-11-10T12:00:00.000Z",
  };

  it("admin bannière perso", () => {
    const admin = rowToAdminCatalogPersoBanner({
      ...sample,
      link_url: "dingry:image-focus:55,35",
    });
    expect(admin.enabled).toBe(true);
    expect(admin.ctaLabel).toBe("CUSTOM");
    expect(admin.imageFocusX).toBe(55);
    expect(admin.imageFocusY).toBe(35);
    expect(admin.cityVisuals).toEqual({});
  });

  it("payload public /api/banners", () => {
    expect(rowToPublicShopBanner(sample)).toMatchObject({
      position: "catalog_perso",
      ctaLabel: "CUSTOM",
      imageUrl: sample.image_url,
    });
  });
});
