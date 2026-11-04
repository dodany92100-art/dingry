import { afterEach, describe, expect, it, vi } from "vitest";
import { assertCronAuthorized, MIN_CRON_SECRET_LENGTH } from "@/lib/cron-auth";

const validSecret = "a".repeat(MIN_CRON_SECRET_LENGTH);

describe("assertCronAuthorized", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prod sans CRON_SECRET → 503", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CRON_SECRET", "");
    const result = assertCronAuthorized(new Request("http://localhost/api/cron/stock-reconcile"));
    expect(result).toEqual({ ok: false, status: 503, error: "CRON non configuré." });
  });

  it("NODE_ENV=test sans secret → 503", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("CRON_SECRET", "");
    expect(assertCronAuthorized(new Request("http://localhost"))).toEqual({
      ok: false,
      status: 503,
      error: "CRON non configuré.",
    });
  });

  it("secret trop court → 503", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CRON_SECRET", "too-short");
    expect(assertCronAuthorized(new Request("http://localhost"))).toEqual({
      ok: false,
      status: 503,
      error: "CRON non configuré.",
    });
  });

  it("dev sans secret → ok", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CRON_SECRET", "");
    expect(assertCronAuthorized(new Request("http://localhost"))).toEqual({ ok: true });
  });

  it("prod avec secret : Bearer exact (sensible à la casse)", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CRON_SECRET", validSecret);
    expect(
      assertCronAuthorized(
        new Request("http://localhost", {
          headers: { authorization: `Bearer ${validSecret}` },
        }),
      ),
    ).toEqual({ ok: true });
    expect(
      assertCronAuthorized(
        new Request("http://localhost", {
          headers: { authorization: `Bearer ${validSecret.toUpperCase()}` },
        }),
      ),
    ).toEqual({ ok: false, status: 401, error: "Non autorisé." });
  });

  it("en-tête absent ou Bearer vide → 401", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CRON_SECRET", validSecret);
    expect(assertCronAuthorized(new Request("http://localhost"))).toEqual({
      ok: false,
      status: 401,
      error: "Non autorisé.",
    });
    expect(
      assertCronAuthorized(
        new Request("http://localhost", { headers: { authorization: "Bearer " } }),
      ),
    ).toEqual({ ok: false, status: 401, error: "Non autorisé." });
  });
});
