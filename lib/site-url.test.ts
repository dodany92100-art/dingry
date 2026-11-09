import { afterEach, describe, expect, it, vi } from "vitest";
import { getSiteUrl } from "@/lib/site-url";

describe("getSiteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("utilise NEXT_PUBLIC_SITE_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.dingry.com");
    vi.stubEnv("VERCEL_URL", "");
    expect(getSiteUrl().origin).toBe("https://www.dingry.com");
  });

  it("accepte un host sans schéma", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "dingry.com");
    expect(getSiteUrl().origin).toBe("https://dingry.com");
  });

  it("repli sur VERCEL_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "dingry-abc.vercel.app");
    expect(getSiteUrl().origin).toBe("https://dingry-abc.vercel.app");
  });

  it("ne throw pas si NEXT_PUBLIC_SITE_URL vide / invalide", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "not a url ???");
    vi.stubEnv("VERCEL_URL", "");
    expect(() => getSiteUrl()).not.toThrow();
    expect(getSiteUrl().origin).toBe("https://dingry.com");
  });
});
