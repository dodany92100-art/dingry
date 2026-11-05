import { afterEach, describe, expect, it, vi } from "vitest";
import { TotpMisconfiguredError } from "@/lib/admin/totp";

describe("POST /api/admin/login", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.doUnmock("@/lib/admin/totp");
    vi.doUnmock("@/lib/admin/login-rate-limit");
  });

  it("503 générique si ADMIN_TOTP_SECRET absent en prod", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.doMock("@/lib/admin/totp", async () => {
      const actual = await vi.importActual<typeof import("@/lib/admin/totp")>("@/lib/admin/totp");
      return {
        ...actual,
        getTotpSecret: vi.fn().mockRejectedValue(new TotpMisconfiguredError()),
        verifyAdminTotp: vi.fn(),
      };
    });
    vi.doMock("@/lib/admin/login-rate-limit", () => ({
      clientAddress: () => "203.0.113.1",
      loginClientAddressBlocked: () => false,
      loginRetryAfterSeconds: async () => 0,
      recordLoginFailure: vi.fn(),
      clearLoginFailures: vi.fn(),
      retryAfterLabel: (s: number) => `${s}s`,
    }));

    const { POST } = await import("@/app/api/admin/login/route");
    const response = await POST(
      new Request("http://localhost/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "123456" }),
      }),
    );
    expect(response.status).toBe(503);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toContain("ADMIN_TOTP_SECRET");
  });

  it("503 sur la route si IP unknown (prod simulée)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.doMock("@/lib/admin/login-rate-limit", async () => {
      const actual = await vi.importActual<typeof import("@/lib/admin/login-rate-limit")>(
        "@/lib/admin/login-rate-limit",
      );
      return {
        ...actual,
        clientAddress: () => "unknown",
      };
    });
    vi.resetModules();
    const { POST } = await import("@/app/api/admin/login/route");
    const response = await POST(
      new Request("http://localhost/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "123456" }),
      }),
    );
    expect(response.status).toBe(503);
    expect(((await response.json()) as { error?: string }).error).toBe("Connexion indisponible.");
  });

  it("503 avec getTotpSecret réel (prod simulée, secret absent)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("ADMIN_TOTP_SECRET", "");
    vi.doMock("@/lib/admin/login-rate-limit", () => ({
      clientAddress: () => "203.0.113.1",
      loginClientAddressBlocked: () => false,
      loginRetryAfterSeconds: async () => 0,
      recordLoginFailure: vi.fn(),
      clearLoginFailures: vi.fn(),
      retryAfterLabel: (s: number) => `${s}s`,
    }));
    vi.resetModules();
    const { POST } = await import("@/app/api/admin/login/route");
    const response = await POST(
      new Request("http://localhost/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "123456" }),
      }),
    );
    expect(response.status).toBe(503);
    expect(((await response.json()) as { error?: string }).error).toContain("ADMIN_TOTP_SECRET");
  });
});
