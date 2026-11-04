import { afterEach, describe, expect, it, vi } from "vitest";
import { createAdminSessionResponse } from "@/lib/admin/auth";
import {
  MIN_ADMIN_SESSION_SECRET_LENGTH,
  sessionSecretFromEnv,
  signAdminSession,
  verifyAdminSession,
} from "@/lib/admin/session-token";
import {
  allowTurnstileDevBypass,
  turnstileExpectedHostnames,
  turnstileHostnameRequired,
  verifyTurnstileToken,
} from "@/lib/turnstile";

describe("sessionSecretFromEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("production sans ADMIN_SESSION_SECRET refuse le repli TOTP", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_SESSION_SECRET", "");
    vi.stubEnv("ADMIN_TOTP_SECRET", "JBSWY3DPEHPK3PXP");
    expect(sessionSecretFromEnv()).toBe("");
  });

  it("production refuse un secret session trop court", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_SESSION_SECRET", "abc");
    expect(sessionSecretFromEnv()).toBe("");
  });

  it("production accepte un secret session ≥ 32 caractères sans normalisation", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    const secret = "a".repeat(MIN_ADMIN_SESSION_SECRET_LENGTH);
    vi.stubEnv("ADMIN_SESSION_SECRET", secret);
    expect(sessionSecretFromEnv()).toBe(secret);
  });

  it("development peut repli sur ADMIN_TOTP_SECRET (trim seulement)", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("ADMIN_SESSION_SECRET", "");
    vi.stubEnv("ADMIN_TOTP_SECRET", "JBSWY3DPEHPK3PXP");
    expect(sessionSecretFromEnv()).toBe("JBSWY3DPEHPK3PXP");
  });
});

describe("createAdminSessionResponse", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("production sans secret session → 503", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_SESSION_SECRET", "");
    const response = await createAdminSessionResponse({ ok: true });
    expect(response.status).toBe(503);
  });

  it("login réussi → Cache-Control no-store", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ADMIN_SESSION_SECRET", "x".repeat(32));
    const response = await createAdminSessionResponse({ ok: true, backupCodes: ["ABCD1234"] });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("verifyAdminSession", () => {
  it("refuse un secret vide", async () => {
    const { token } = await signAdminSession("TESTSECRET");
    expect(await verifyAdminSession(token, "")).toBe(false);
  });
});

describe("allowTurnstileDevBypass", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("preview Vercel (NODE_ENV production) → pas de bypass", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(allowTurnstileDevBypass()).toBe(false);
    expect(turnstileHostnameRequired()).toBe(true);
  });
});

describe("turnstileExpectedHostnames", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parse plusieurs hôtes", () => {
    vi.stubEnv("TURNSTILE_EXPECTED_HOSTNAME", "dingry.com, www.dingry.com");
    expect(turnstileExpectedHostnames()).toEqual(["dingry.com", "www.dingry.com"]);
  });
});

describe("verifyTurnstileToken developpement", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("refuse developpement hors dev local même avec secret", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "test-secret-key");
    vi.stubEnv("TURNSTILE_EXPECTED_HOSTNAME", "dingry.com");
    const verdict = await verifyTurnstileToken("developpement");
    expect(verdict.ok).toBe(false);
  });

  it("503 si hostname requis mais TURNSTILE_EXPECTED_HOSTNAME absent en prod", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "test-secret-key");
    vi.stubEnv("TURNSTILE_EXPECTED_HOSTNAME", "");
    vi.stubEnv("VERCEL_URL", "");
    const verdict = await verifyTurnstileToken("012345678901234567890");
    expect(verdict).toEqual({ ok: false, status: 503, error: "Protection anti-bot indisponible." });
  });
});

describe("loginRetryAfterSeconds sans Redis", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("@/lib/ratelimit");
    vi.resetModules();
  });

  it("production → unavailable (fail-closed)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.doMock("@/lib/ratelimit", () => ({
      getSharedRedis: () => null,
    }));
    const { loginRetryAfterSeconds: retry } = await import("@/lib/admin/login-rate-limit");
    expect(await retry("127.0.0.1")).toBe("unavailable");
  });
});
