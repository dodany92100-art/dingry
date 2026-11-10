/**
 * Migre visuels marque (hero, éditorial, logos, lookbook CRM) Cloudinary → R2.
 * Usage : npx tsx scripts/migrate-static-brand-to-r2.ts [--dry-run]
 */
import { config } from "dotenv";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { migrateUrlToR2, isR2ImageStorageEnabled, r2BaseForLogs } from "../lib/r2/migrate-image";
import { isR2PublicUrl } from "../lib/r2/config";

config({ path: path.join(process.cwd(), ".env") });
config({ path: path.join(process.cwd(), ".env.local"), override: true });

const CLOUD = "https://res.cloudinary.com/dc9xmxpvv/image/upload";

const BRAND_ASSETS = [
  {
    id: "hero-shop",
    folder: "dingry/brand/hero",
    label: "teasing-hero",
    source: `${CLOUD}/f_auto,q_auto,w_1920,c_crop,g_north,h_1430,w_1960/v1793310395/014c39fa-7191-491e-a893-a58b934498dd_no55a0.jpg`,
  },
  {
    id: "editorial",
    folder: "dingry/brand/editorial",
    label: "rock-the-street",
    source: `${CLOUD}/v1793134245/IMG_4031_o8jpgl.jpg`,
  },
  {
    id: "logo-navbar",
    folder: "dingry/brand/logo",
    label: "wordmark-navbar",
    source: `${CLOUD}/v1793299822/WhatsApp_Image_2026-10-28_at_14.07.43-removebg-preview_rrprgr.png`,
  },
  {
    id: "street-wordmark",
    folder: "dingry/brand/wordmark",
    label: "rock-the-street-title",
    source: `${CLOUD}/v1794068055/PHOTO-2026-11-07-16-33-18_xgdfzc.jpg`,
  },
  {
    id: "og-share",
    folder: "dingry/brand/og",
    label: "open-graph",
    source: `${CLOUD}/c_fill,g_auto,w_1200,h_630,q_auto,f_jpg/v1794067901/5e07c5b5-1d5c-4e2f-b82d-3d3e6e64c223_riosv9.jpg`,
  },
] as const;

async function migrateLookbookSlides(dryRun: boolean): Promise<void> {
  const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !key) {
    console.log("Supabase absent — skip lookbook_slides.");
    return;
  }
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await client.from("lookbook_slides").select("id,title,image_url");
  if (error) {
    console.warn("lookbook_slides:", error.message);
    return;
  }
  for (const row of data ?? []) {
    const imageUrl = String(row.image_url ?? "").trim();
    if (!imageUrl || isR2PublicUrl(imageUrl) || !imageUrl.includes("cloudinary")) continue;
    const id = String(row.id);
    console.log(`→ lookbook ${id} (${row.title})`);
    if (dryRun) continue;
    const { imageUrl: r2Url } = await migrateUrlToR2(imageUrl, `dingry/lookbook/${id}`, "slide");
    const { error: upErr } = await client
      .from("lookbook_slides")
      .update({ image_url: r2Url, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (upErr) throw new Error(upErr.message);
    console.log(`  ${r2Url}`);
  }
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  if (!isR2ImageStorageEnabled()) {
    throw new Error("R2 non configuré (.env.local).");
  }
  console.log(`R2 : ${r2BaseForLogs()}${dryRun ? " (dry-run)" : ""}\n`);

  const migrated: Record<string, string> = {};
  for (const asset of BRAND_ASSETS) {
    console.log(`→ ${asset.id}`);
    if (dryRun) {
      migrated[asset.id] = asset.source;
      continue;
    }
    const { imageUrl } = await migrateUrlToR2(asset.source, asset.folder, asset.label);
    migrated[asset.id] = imageUrl;
    console.log(`  ${imageUrl}`);
  }

  if (!dryRun) {
    await migrateLookbookSlides(false);
  }

  console.log("\n--- JSON (référence) ---");
  console.log(JSON.stringify(migrated, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
