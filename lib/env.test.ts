import { afterEach, describe, expect, it, vi } from "vitest";
import { collectProductionEnvErrors, validateProductionEnv } from "@/lib/env";

const PROD_KEYS = [
  "NODE_ENV",
  "VITEST",
  "SKIP_ENV_VALIDATION",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "BLOB_READ_WRITE_TOKEN",
] as const;

const snapshot = Object.fromEntries(PROD_KEYS.map((k) => [k, process.env[k]]));

afterEach(() => {
  vi.unstubAllEnvs();
  for (const key of PROD_KEYS) {
    if (key === "NODE_ENV") continue;
    const value = snapshot[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  const nodeEnv = snapshot.NODE_ENV;
  if (nodeEnv !== undefined) vi.stubEnv("NODE_ENV", nodeEnv);
});

function prodEnv(overrides: Record<string, string | undefined>) {
  vi.stubEnv("NODE_ENV", "production");
  delete process.env.VITEST;
  delete process.env.SKIP_ENV_VALIDATION;
  delete process.env.SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.BLOB_READ_WRITE_TOKEN;
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

describe("validateProductionEnv", () => {
  it("ne fait rien en développement", () => {
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(() => validateProductionEnv()).not.toThrow();
  });

  it("exige la paire Supabase complète ou Blob", () => {
    prodEnv({});
    const errors = collectProductionEnvErrors();
    expect(errors.some((e) => e.includes("Stockage CRM"))).toBe(true);
    expect(() => validateProductionEnv()).toThrow(/Variables d'environnement production invalides/);
  });

  it("rejette Supabase partiel (URL sans service role)", () => {
    prodEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://xxx.supabase.co",
      BLOB_READ_WRITE_TOKEN: "token",
    });
    const errors = collectProductionEnvErrors();
    expect(errors.some((e) => e.includes("SUPABASE_SERVICE_ROLE_KEY"))).toBe(true);
  });

  it("accepte Supabase complet", () => {
    prodEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://xxx.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
    });
    expect(collectProductionEnvErrors()).toEqual([]);
    expect(() => validateProductionEnv()).not.toThrow();
  });

  it("accepte Blob seul", () => {
    prodEnv({ BLOB_READ_WRITE_TOKEN: "vercel-blob-token" });
    expect(collectProductionEnvErrors()).toEqual([]);
    expect(() => validateProductionEnv()).not.toThrow();
  });
});
