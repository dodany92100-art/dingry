import { afterEach, describe, expect, it, vi } from "vitest";
import {
  hasProductionCatalogBackend,
  isBlobConfigured,
  isSupabaseCatalogEnvComplete,
} from "@/lib/admin/blob-config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("hasProductionCatalogBackend", () => {
  it("production Supabase + Blob → backend catalogue OK", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://xxx.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "vercel_blob_rw_test");
    expect(isSupabaseCatalogEnvComplete()).toBe(true);
    expect(isBlobConfigured()).toBe(true);
    expect(hasProductionCatalogBackend()).toBe(true);
  });

  it("production sans Supabase → refus", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(hasProductionCatalogBackend()).toBe(false);
  });
});
