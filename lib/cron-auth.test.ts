import { afterEach, describe, expect, it } from "vitest";
import { assertCronAuthorized, MIN_CRON_SECRET_LENGTH } from "@/lib/cron-auth";

const env = process.env;
const validSecret = "a".repeat(MIN_CRON_SECRET_LENGTH);

describe("assertCronAuthorized", () => {
  afterEach(() => {
    process.env = { ...env };
  });

  it("prod sans CRON_SECRET → 503", () => {
    process.env.NODE_ENV = "production";
    delete process.env.CRON_SECRET;
    const result = assertCronAuthorized(new Request("http://localhost/api/cron/stock-reconcile"));
    expect(result).toEqual({ ok: false, status: 503, error: "CRON non configuré." });
  });

  it("NODE_ENV=test sans secret → 503", () => {
    process.env.NODE_ENV = "test";
    delete process.env.CRON_SECRET;
    expect(assertCronAuthorized(new Request("http://localhost"))).toEqual({
      ok: false,
      status: 503,
      error: "CRON non configuré.",
    });
  });

  it("secret trop court → 503", () => {
    process.env.NODE_ENV = "production";
    process.env.CRON_SECRET = "too-short";
    expect(assertCronAuthorized(new Request("http://localhost"))).toEqual({
      ok: false,
      status: 503,
      error: "CRON non configuré.",
    });
  });

  it("dev sans secret → ok", () => {
    process.env.NODE_ENV = "development";
    delete process.env.CRON_SECRET;
    expect(assertCronAuthorized(new Request("http://localhost"))).toEqual({ ok: true });
  });

  it("prod avec secret : Bearer exact (sensible à la casse)", () => {
    process.env.NODE_ENV = "production";
    process.env.CRON_SECRET = validSecret;
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
    process.env.NODE_ENV = "production";
    process.env.CRON_SECRET = validSecret;
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
