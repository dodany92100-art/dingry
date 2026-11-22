import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSupabaseShopBannerByPosition, supabaseFrom, listSupabaseShopBannersMock } = vi.hoisted(() => ({
  getSupabaseShopBannerByPosition: vi.fn(),
  supabaseFrom: vi.fn(),
  listSupabaseShopBannersMock: vi.fn(),
}));

vi.mock("@/lib/supabase/shop-banners", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/supabase/shop-banners")>();
  return {
    ...mod,
    getSupabaseShopBannerByPosition,
    listSupabaseShopBanners: listSupabaseShopBannersMock,
  };
});

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: () => ({
    from: supabaseFrom,
  }),
}));

vi.mock("server-only", () => ({}));

import {
  isPrivateConfigTableMissing,
  readSupabaseAtelierCustomJson,
  upsertSupabaseAtelierCustomJson,
} from "@/lib/supabase/atelier-custom-store";
import { SHOP_BANNER_POSITION_ATELIER_CUSTOM } from "@/lib/supabase/shop-banners";

const root = path.resolve(import.meta.dirname, "../..");

function mockPrivateSelectResult(result: { data: unknown; error: { code?: string; message: string } | null }) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  supabaseFrom.mockReturnValue({ select, upsert: vi.fn() });
}

describe("isPrivateConfigTableMissing", () => {
  it("true pour PGRST205 et 42P01", () => {
    expect(isPrivateConfigTableMissing({ code: "PGRST205", message: "x" })).toBe(true);
    expect(isPrivateConfigTableMissing({ code: "42P01", message: "undefined_table" })).toBe(true);
  });

  it("false pour permission ou réseau", () => {
    expect(isPrivateConfigTableMissing({ code: "42501", message: "permission denied" })).toBe(false);
    expect(isPrivateConfigTableMissing({ code: "ECONNRESET", message: "network" })).toBe(false);
  });
});

describe("readSupabaseAtelierCustomJson", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSupabaseShopBannerByPosition.mockReset();
  });

  it("repli legacy sur PGRST205", async () => {
    mockPrivateSelectResult({ data: null, error: { code: "PGRST205", message: "schema" } });
    getSupabaseShopBannerByPosition.mockResolvedValue({
      link_url: '{"enabled":true}',
      updated_at: "2026-01-01T00:00:00Z",
    });

    const out = await readSupabaseAtelierCustomJson();
    expect(getSupabaseShopBannerByPosition).toHaveBeenCalledWith(SHOP_BANNER_POSITION_ATELIER_CUSTOM);
    expect(out.json).toBe('{"enabled":true}');
  });

  it("repli legacy sur 42P01", async () => {
    mockPrivateSelectResult({ data: null, error: { code: "42P01", message: "relation does not exist" } });
    getSupabaseShopBannerByPosition.mockResolvedValue(null);

    await readSupabaseAtelierCustomJson();
    expect(getSupabaseShopBannerByPosition).toHaveBeenCalled();
  });

  it("pas de repli sur 42501", async () => {
    mockPrivateSelectResult({ data: null, error: { code: "42501", message: "permission denied" } });
    await expect(readSupabaseAtelierCustomJson()).rejects.toThrow(/permission denied/);
    expect(getSupabaseShopBannerByPosition).not.toHaveBeenCalled();
  });
});

describe("upsertSupabaseAtelierCustomJson", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSupabaseShopBannerByPosition.mockReset();
  });

  it("erreur explicite si table absente (PGRST205)", async () => {
    const upsert = vi.fn().mockResolvedValue({
      error: { code: "PGRST205", message: "schema cache" },
    });
    supabaseFrom.mockReturnValue({ upsert });

    await expect(upsertSupabaseAtelierCustomJson("{}", true)).rejects.toThrow(/20261122181000/);
    expect(getSupabaseShopBannerByPosition).not.toHaveBeenCalled();
  });

  it("propage une erreur non-repli", async () => {
    const upsert = vi.fn().mockResolvedValue({
      error: { code: "42501", message: "permission denied" },
    });
    supabaseFrom.mockReturnValue({ upsert });

    await expect(upsertSupabaseAtelierCustomJson("{}", true)).rejects.toThrow(/permission denied/);
  });
});

describe("atelier-custom-store invariants", () => {
  it("aucune écriture vers shop_banners dans le module", () => {
    const src = readFileSync(path.join(root, "lib/supabase/atelier-custom-store.ts"), "utf8");
    expect(src).not.toMatch(/\.from\(\s*["']shop_banners["']\s*\)\s*\.\s*(insert|upsert|update|delete)/i);
  });

  it("non importé par des fichiers use client", () => {
    const raw = execSync(`rg -l 'atelier-custom-store' .`, { cwd: root, encoding: "utf8" }).trim();
    const hits = raw ? raw.split("\n") : [];
    const clientFiles: string[] = [];
    for (const rel of hits) {
      if (!/\.(ts|tsx)$/.test(rel) || /\.test\.(ts|tsx)$/.test(rel)) continue;
      const body = readFileSync(path.join(root, rel), "utf8");
      if (/^\s*["']use client["']/.test(body) || body.includes('"use client"')) {
        clientFiles.push(rel);
      }
    }
    expect(clientFiles).toEqual([]);
  });
});
