import { describe, expect, it, vi } from "vitest";
import { StoreUnavailableError } from "@/lib/admin/store-errors";
import {
  adminCrmMediaBackendGuard,
  adminCrmMediaReadGuard,
  respondAdminCrmWriteError,
} from "@/lib/admin/admin-crm-route";

describe("adminCrmMediaBackendGuard", () => {
  it("bloque si Supabase incomplet", () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const blocked = adminCrmMediaBackendGuard();
    expect(blocked?.status).toBe(503);
    vi.unstubAllEnvs();
  });

  it("lecture : Supabase seul suffit (sans R2)", () => {
    vi.stubEnv("VITEST", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key-mock-32chars-min");
    vi.stubEnv("R2_ACCESS_KEY_ID", "");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "");
    vi.stubEnv("R2_ACCOUNT_ID", "");
    expect(adminCrmMediaReadGuard()).toBeNull();
    expect(adminCrmMediaBackendGuard()?.status).toBe(503);
    vi.unstubAllEnvs();
  });

  it("lecture : dev sans Supabase → pas de blocage (seed)", () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(adminCrmMediaReadGuard()).toBeNull();
    vi.unstubAllEnvs();
  });
});

describe("respondAdminCrmWriteError", () => {
  it("expose le message Supabase/R2", async () => {
    const response = respondAdminCrmWriteError(
      new Error("duplicate key value violates unique constraint"),
      "test",
      "échec",
    );
    expect(response.status).toBe(500);
    const body = (await response.json()) as { error: string };
    expect(body.error).toContain("duplicate key");
  });

  it("StoreUnavailableError → 400 si message métier", async () => {
    const response = respondAdminCrmWriteError(
      new StoreUnavailableError("Une image est requise."),
      "test",
      "échec",
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("Une image est requise.");
  });
});
