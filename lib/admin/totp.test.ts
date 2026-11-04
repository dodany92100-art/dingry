import { afterEach, describe, expect, it, vi } from "vitest";
import { TotpMisconfiguredError, getTotpSecret, totpTestHooks } from "@/lib/admin/totp";

describe("getTotpSecret", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("production sans ADMIN_TOTP_SECRET → erreur explicite", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_TOTP_SECRET", "");
    await expect(getTotpSecret()).rejects.toBeInstanceOf(TotpMisconfiguredError);
  });
});

describe("consumeTotpStep anti-rejeu", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("@/lib/ratelimit");
    vi.resetModules();
  });

  it("refuse le même pas deux fois", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const set = vi
      .fn()
      .mockImplementationOnce(async () => "OK")
      .mockImplementationOnce(async () => null);
    vi.resetModules();
    vi.doMock("@/lib/ratelimit", () => ({
      getSharedRedis: () => ({ set }),
    }));
    const { totpTestHooks: hooks } = await import("@/lib/admin/totp");
    expect(await hooks.consumeTotpStep(424242)).toBe(true);
    expect(await hooks.consumeTotpStep(424242)).toBe(false);
    expect(set).toHaveBeenCalledTimes(2);
    vi.doUnmock("@/lib/ratelimit");
    vi.resetModules();
  });
});

describe("totp window", () => {
  it("fenêtre ±1 pas", () => {
    expect(totpTestHooks.window).toBe(1);
  });
});
