import { afterEach, describe, expect, it, vi } from "vitest";

describe("loginRetryAfterSeconds (Redis mock)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("@/lib/ratelimit");
    vi.resetModules();
  });

  it("ne impose pas 15 min si la clé IP a expiré entre GET et TTL", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const ipKey = "dingry:admin-login:ip:203.0.113.1";
    vi.doMock("@/lib/ratelimit", () => ({
      getSharedRedis: () => ({
        get: vi.fn(async (key: string) => (key === ipKey ? 8 : 0)),
        ttl: vi.fn(async (key: string) => (key === ipKey ? -2 : -2)),
        expire: vi.fn(async () => 0),
      }),
    }));
    vi.resetModules();
    const { loginRetryAfterSeconds } = await import("@/lib/admin/login-rate-limit");
    expect(await loginRetryAfterSeconds("203.0.113.1")).toBe(0);
  });

  it("renvoie le TTL quand le compteur IP est au plafond", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const ipKey = "dingry:admin-login:ip:203.0.113.1";
    vi.doMock("@/lib/ratelimit", () => ({
      getSharedRedis: () => ({
        get: vi.fn(async (key: string) => (key === ipKey ? 8 : 0)),
        ttl: vi.fn(async (key: string) => (key === ipKey ? 42 : -2)),
        expire: vi.fn(async () => 0),
      }),
    }));
    vi.resetModules();
    const { loginRetryAfterSeconds } = await import("@/lib/admin/login-rate-limit");
    expect(await loginRetryAfterSeconds("203.0.113.1")).toBe(42);
  });
});

describe("loginClientAddressBlocked", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("bloque unknown hors development et sans runtime Vercel", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "");
    const { loginClientAddressBlocked } = await import("@/lib/admin/login-rate-limit");
    expect(loginClientAddressBlocked("unknown")).toBe(true);
    expect(loginClientAddressBlocked("203.0.113.1")).toBe(false);
  });

  it("ne bloque pas unknown sur Vercel", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    const { loginClientAddressBlocked } = await import("@/lib/admin/login-rate-limit");
    expect(loginClientAddressBlocked("unknown")).toBe(false);
  });
});

describe("turnstile preview hostname", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepte VERCEL_URL en preview", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "dingry-git-master-days-projects-36e5dc27.vercel.app");
    const { turnstileHostnameAllowed, turnstileHostnameConfigured } = await import("@/lib/turnstile");
    expect(turnstileHostnameConfigured()).toBe(true);
    expect(turnstileHostnameAllowed("dingry-git-master-days-projects-36e5dc27.vercel.app")).toBe(true);
  });

  it("accepte suffixe preview configuré", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("TURNSTILE_PREVIEW_HOST_SUFFIX", "-days-projects-36e5dc27.vercel.app");
    const { turnstileHostnameAllowed } = await import("@/lib/turnstile");
    expect(turnstileHostnameAllowed("dingry-git-master-days-projects-36e5dc27.vercel.app")).toBe(true);
  });

  it("accepte tout hostname *.vercel.app en preview", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    const { turnstileHostnameAllowed } = await import("@/lib/turnstile");
    expect(turnstileHostnameAllowed("dingry-ksdxpmjuf-days-projects-36e5dc27.vercel.app")).toBe(true);
  });
});
