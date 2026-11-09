import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canonicalizeR2PublicImageUrl,
  objectKeyFromR2PublicUrl,
  R2_DEFAULT_BUCKET_NAME,
  R2_S3_ACCESS_KEY_ID_LENGTH,
  R2_S3_SECRET_ACCESS_KEY_LENGTH,
  r2BucketName,
  r2CredentialFormatError,
  r2PublicUrlForKey,
} from "@/lib/r2/config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("r2CredentialFormatError", () => {
  it("accepte 32 + 64 caractères", () => {
    vi.stubEnv("R2_ACCESS_KEY_ID", "a".repeat(R2_S3_ACCESS_KEY_ID_LENGTH));
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "b".repeat(R2_S3_SECRET_ACCESS_KEY_LENGTH));
    expect(r2CredentialFormatError()).toBeNull();
  });

  it("détecte une ACCESS_KEY_ID trop longue (souvent la secret key)", () => {
    vi.stubEnv("R2_ACCESS_KEY_ID", "b".repeat(65));
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "a".repeat(R2_S3_SECRET_ACCESS_KEY_LENGTH));
    expect(r2CredentialFormatError()).toMatch(/R2_ACCESS_KEY_ID invalide \(65/);
  });

  it("détecte l’URL publique / endpoint dans ACCESS_KEY_ID", () => {
    vi.stubEnv(
      "R2_ACCESS_KEY_ID",
      "https://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.r2.cloudflarestorage.com",
    );
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "b".repeat(R2_S3_SECRET_ACCESS_KEY_LENGTH));
    expect(r2CredentialFormatError()).toMatch(/URL publique/);
  });
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

  it("réécrit un ancien domaine pub R2 vers la base configurée", () => {
    vi.stubEnv("R2_PUBLIC_BASE_URL", "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev");
    const stale =
      "https://pub-8ef850fa01fb9fda829a4ffa6455c86b.r2.dev/dingry/products/56/recto/x.webp";
    expect(canonicalizeR2PublicImageUrl(stale)).toBe(
      "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/products/56/recto/x.webp",
    );
  });
});
