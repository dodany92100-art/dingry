import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MIN_PREVIEW_SECRET_LENGTH,
  isPreviewFeatureEnabled,
  previewSecretFromEnv,
  signPreviewCookie,
  verifyPreviewCookie,
} from "@/lib/preview-cookie";

const SECRET = "p".repeat(MIN_PREVIEW_SECRET_LENGTH);

afterEach(() => vi.unstubAllEnvs());

describe("preview-cookie", () => {
  it("est inactif sans split ou secret", () => {
    vi.stubEnv("DINGRY_CRM_HOST", "");
    vi.stubEnv("DINGRY_PREVIEW_SECRET", "");
    expect(isPreviewFeatureEnabled()).toBe(false);
    expect(previewSecretFromEnv()).toBe("");
  });

  it("secret trop court ignoré", () => {
    vi.stubEnv("DINGRY_PREVIEW_SECRET", "short");
    expect(previewSecretFromEnv()).toBe("");
  });

  it("signature valide et expirée", async () => {
    vi.stubEnv("DINGRY_CRM_HOST", "crm.dingry.com");
    vi.stubEnv("DINGRY_PREVIEW_SECRET", SECRET);
    const { token } = await signPreviewCookie(SECRET, Date.now());
    await expect(verifyPreviewCookie(token, SECRET)).resolves.toBe(true);
    await expect(verifyPreviewCookie(token, SECRET, Date.now() + 9 * 60 * 60 * 1000)).resolves.toBe(false);
  });

  it("rejette une signature falsifiée", async () => {
    const { token } = await signPreviewCookie(SECRET);
    const [body] = token.split(".");
    await expect(verifyPreviewCookie(`${body}.bogus`, SECRET)).resolves.toBe(false);
  });
});