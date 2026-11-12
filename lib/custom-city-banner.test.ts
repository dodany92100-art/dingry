import { describe, expect, it } from "vitest";
import {
  CUSTOM_BANNER_SUGGESTED_CITIES,
  bannerConfiguratorInitialLabel,
  formatPersoBannerSubtitle,
  matchBannerCityFromQuery,
  resolveCustomBannerBackground,
} from "@/lib/custom-city-banner";
import { PERSONALIZATION_MAX_LABEL_LENGTH } from "@/lib/shop-data";

describe("custom-city-banner", () => {
  it("subtitle bandeau sans virgule avant « avec »", () => {
    expect(formatPersoBannerSubtitle("Personnalise ton tee-shirt, avec le nom de ta ville")).toBe(
      "Personnalise ton tee-shirt avec le nom de ta ville",
    );
  });

  it("majuscules et limite 28 caractères", () => {
    expect(bannerConfiguratorInitialLabel(" madinina ")).toBe("MADININA");
    expect(bannerConfiguratorInitialLabel("x".repeat(40))).toHaveLength(
      PERSONALIZATION_MAX_LABEL_LENGTH,
    );
  });

  it("suggestions : Paris, Marseille, Lyon", () => {
    expect(CUSTOM_BANNER_SUGGESTED_CITIES).toEqual(["PARIS", "MARSEILLE", "LYON"]);
  });

  it("match ville par label ou préfixe", () => {
    expect(matchBannerCityFromQuery("mar")?.id).toBe("marseille");
    expect(matchBannerCityFromQuery("zzz")).toBeNull();
  });

  it("fond : ville prioritaire, puis admin", () => {
    expect(resolveCustomBannerBackground("https://cdn/x.webp", "https://admin/y.jpg")).toBe(
      "https://cdn/x.webp",
    );
    expect(resolveCustomBannerBackground(null, "https://admin/y.jpg")).toBe("https://admin/y.jpg");
    expect(resolveCustomBannerBackground(null, "")).toBeNull();
  });
});
