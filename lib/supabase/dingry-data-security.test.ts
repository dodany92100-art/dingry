import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  filterPublicShopBannerRows,
  SHOP_BANNER_POSITION_ATELIER_CUSTOM,
  SHOP_BANNER_POSITION_CATALOG_PERSO,
  type ShopBannerRow,
} from "@/lib/supabase/shop-banners";

const root = path.resolve(import.meta.dirname, "../..");

describe("shop_banners exposition publique", () => {
  const base: ShopBannerRow = {
    id: "b1",
    title: "T",
    subtitle: "S",
    eyebrow: "E",
    cta_label: "C",
    image_url: "https://cdn.example/x.webp",
    link_url: "/x",
    image_blob_pathname: null,
    position: SHOP_BANNER_POSITION_CATALOG_PERSO,
    is_active: true,
    created_at: "",
    updated_at: "",
  };

  it("exclut atelier_custom du filtre marketing", () => {
    const atelier: ShopBannerRow = { ...base, id: "a1", position: SHOP_BANNER_POSITION_ATELIER_CUSTOM };
    const out = filterPublicShopBannerRows([base, atelier]);
    expect(out.map((r) => r.position)).toEqual([SHOP_BANNER_POSITION_CATALOG_PERSO]);
  });

  it("listPublicSupabaseShopBanners passe par filterPublicShopBannerRows", () => {
    const src = readFileSync(path.join(root, "lib/supabase/shop-banners.ts"), "utf8");
    expect(src).toMatch(/export async function listPublicSupabaseShopBanners[\s\S]*filterPublicShopBannerRows/);
  });
});

describe("checklist RGPD / stockage DINGRY", () => {
  it("data/admin reste hors git ls-files", () => {
    const listed = execSync("git ls-files data/admin", { cwd: root, encoding: "utf8" }).trim();
    expect(listed).toBe("");
  });

  it("shop_private_config : migration transactionnelle sans accès anon", () => {
    const sql = readFileSync(
      path.join(root, "supabase/migrations/20261122181000_shop_private_config_atelier.sql"),
      "utf8",
    );
    expect(sql).toMatch(/\bbegin\s*;/i);
    expect(sql).toMatch(/\bcommit\s*;/i);
    expect(sql).toMatch(/on conflict \(key\) do nothing/i);
    expect(sql).toMatch(/shop_private_config enable row level security/i);
    expect(sql).toMatch(/revoke all on table public\.shop_private_config from anon,\s*authenticated/i);
    expect(sql).not.toMatch(/revoke all on table public\.shop_private_config from public/i);
    expect(sql).not.toMatch(/grant select on table public\.shop_private_config to anon/i);
  });

  it("commandes : pas de client Supabase navigateur dans lib/shop", () => {
    const shopDir = path.join(root, "lib/shop");
    const stack: string[] = [shopDir];
    const hits: string[] = [];
    while (stack.length > 0) {
      const dir = stack.pop()!;
      for (const name of readdirSync(dir)) {
        const full = path.join(dir, name);
        if (statSync(full).isDirectory()) stack.push(full);
        else if (name.endsWith(".ts") && !name.endsWith(".test.ts")) {
          const body = readFileSync(full, "utf8");
          if (/getSupabaseBrowser|NEXT_PUBLIC_SUPABASE_ANON/.test(body)) {
            hits.push(path.relative(root, full));
          }
        }
      }
    }
    expect(hits).toEqual([]);
  });
});