import { afterEach, describe, expect, it, vi } from "vitest";
import {
  objectKeyFromR2PublicUrl,
  R2_DEFAULT_BUCKET_NAME,
  r2BucketName,
  r2PublicUrlForKey,
} from "@/lib/r2/config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("r2 bucket", () => {
  it("défaut R2_BUCKET_NAME → dingrybuckets", () => {
    vi.stubEnv("R2_BUCKET_NAME", "");
    expect(r2BucketName()).toBe(R2_DEFAULT_BUCKET_NAME);
    expect(R2_DEFAULT_BUCKET_NAME).toBe("dingrybuckets");
  });
});

describe("r2 URLs", () => {
  it("construit une URL publique à partir d’une clé objet", () => {
    vi.stubEnv("R2_PUBLIC_BASE_URL", "pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev");
    expect(r2PublicUrlForKey("products/12/recto/x.webp")).toBe(
      "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/products/12/recto/x.webp",
    );
  });

  it("retrouve la clé objet depuis l’URL publique", () => {
    vi.stubEnv("R2_PUBLIC_BASE_URL", "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev");
    const url =
      "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/products/7/recto/a.webp";
    expect(objectKeyFromR2PublicUrl(url)).toBe("dingry/products/7/recto/a.webp");
  });
});
