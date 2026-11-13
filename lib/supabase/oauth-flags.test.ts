import { afterEach, describe, expect, it, vi } from "vitest";
import { isSupabaseOAuthProviderEnabled } from "@/lib/supabase/oauth-flags";

describe("isSupabaseOAuthProviderEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prod : Google si Supabase configuré", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_OAUTH_GOOGLE", "");
    expect(isSupabaseOAuthProviderEnabled("google")).toBe(true);
  });

  it("prod : désactive Google si flag = 0", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_OAUTH_GOOGLE", "0");
    expect(isSupabaseOAuthProviderEnabled("google")).toBe(false);
  });

  it("prod : affiche si flag = 1", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_OAUTH_GOOGLE", "1");
    expect(isSupabaseOAuthProviderEnabled("google")).toBe(true);
  });

  it("dev : Google sans flag si Supabase configuré", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_OAUTH_GOOGLE", "");
    expect(isSupabaseOAuthProviderEnabled("google")).toBe(true);
  });
});
