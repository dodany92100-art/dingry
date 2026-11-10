/**
 * Repli catalogue (flip recto/verso, personnalisation) : Cloudinary → R2.
 * npx tsx scripts/migrate-legacy-catalog-fallbacks-to-r2.ts
 */
import { config } from "dotenv";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { adminProductToRow, rowToAdminProduct, type ProductRow } from "../lib/supabase/product-row";
import { migrateUrlToR2, isR2ImageStorageEnabled, r2BaseForLogs } from "../lib/r2/migrate-image";

config({ path: path.join(process.cwd(), ".env") });
config({ path: path.join(process.cwd(), ".env.local"), override: true });

const CLOUD = "https://res.cloudinary.com/dc9xmxpvv/image/upload";

/** Sources historiques (commit e7af1db). */
const LEGACY_SOURCES: Record<string, string> = {
  hoodie1: `${CLOUD}/v1793122066/HOODIE_DINGRY_ORIGINAL_BLEU_ROI_-_VERSO_xsoywe.png`,
  hoodie2: `${CLOUD}/v1793122066/HOODIE_DINGRY_ORIGINAL_BLEU_ROI_-_RECTO_m541tv.png`,
  hoodie3: `${CLOUD}/v1793122065/DINGRY_HOODIE_ORIGINAL_VERT_VERSO_g3tdgu.png`,
  hoodie4: `${CLOUD}/v1793122064/HOODIE_DINGRY_BLACK_ZIPPE%CC%81_OUTLINE_RECTO_iedtrv.png`,
  hoodie5: `${CLOUD}/v1793122064/HOODIE_DINGRY_BLACK_ZIPPE%CC%81_OUTLINE_VERSO_ljjxwj.png`,
  hoodie6: `${CLOUD}/v1793122064/DINGRY_HOODIE_ORIGINAL_BLACK_RECTO_knvlfw.png`,
  hoodie7: `${CLOUD}/v1793122063/DINGRY_HOODIE_ORIGINAL_VERT_RECTO_b4ilsd.png`,
  hoodie8: `${CLOUD}/v1793122061/DINGRY_-_HOODIE_ORIGINAL_BLACK_VERSO_llv6wk.png`,
  tee1: `${CLOUD}/v1793315162/a673505c-3fd5-4146-ad69-0557ec774686_ohpztn.jpg`,
  tee3: `${CLOUD}/v1793124729/PHOTO-2026-06-26-22-50-56_4_r3ivag.jpg`,
  tee5: `${CLOUD}/v1793124728/PHOTO-2026-06-26-22-50-56_2_cxu50l.jpg`,
  tee7: `${CLOUD}/v1793124727/PHOTO-2026-06-26-22-50-56_3_cnbjll.jpg`,
  tee10: `${CLOUD}/v1793124726/PHOTO-2026-06-26-22-50-56_8_g8yqde.jpg`,
  teeBlackRecto: `${CLOUD}/v1793315162/c613df1f-7feb-4d7f-a1c2-d1018d94302b_tkal8j.jpg`,
  teeBlackVerso: `${CLOUD}/v1793315162/f5c4805b-561d-4c9c-92d1-9e61a6c824e4_soqs1x.jpg`,
  teeWhiteRecto: `${CLOUD}/v1793315162/10324a1f-74eb-49cc-93b4-f0a118abc4fd_pqku5a.jpg`,
  teeWhiteVerso: `${CLOUD}/v1793315162/a673505c-3fd5-4146-ad69-0557ec774686_ohpztn.jpg`,
  hoodieParisBlackRecto: `${CLOUD}/v1793122064/DINGRY_HOODIE_ORIGINAL_BLACK_RECTO_knvlfw.png`,
  hoodieParisBlackVerso: `${CLOUD}/v1793122061/DINGRY_-_HOODIE_ORIGINAL_BLACK_VERSO_llv6wk.png`,
  hoodieParisGreyRecto: `${CLOUD}/v1793306684/ca6a0e1d-0d92-4874-a19f-ec5a17c55a01_decasg.jpg`,
  hoodieParisGreyVerso: `${CLOUD}/v1793306684/91bdf646-f629-4a1d-820c-9970f030082b_i9iifq.jpg`,
  hoodieParisWhiteRecto: `${CLOUD}/v1793305029/WhatsApp_Image_2026-10-29_at_21.10.29_6_knkft7.jpg`,
  hoodieParisWhiteVerso: `${CLOUD}/v1793305029/WhatsApp_Image_2026-10-29_at_21.10.29_7_b0lt3a.jpg`,
  hoodieRoyalBlueRecto: `${CLOUD}/v1793305029/WhatsApp_Image_2026-10-29_at_21.10.29_4_uqwkfr.jpg`,
  hoodieRoyalBlueVerso: `${CLOUD}/v1793305029/WhatsApp_Image_2026-10-29_at_21.10.29_5_qxfgih.jpg`,
  sweatNeonYellowRecto: `${CLOUD}/v1793306684/2a7fbbbe-54b9-4f5a-bc83-c5c77fb34b1d_hf0rly.jpg`,
  sweatNeonYellowVerso: `${CLOUD}/v1793306684/1deacdcc-f442-4f5c-9517-68dd3fd2d3ed_jop32c.jpg`,
  sweatRoyalBlueRecto: `${CLOUD}/v1793305028/WhatsApp_Image_2026-10-29_at_21.10.45_2_ntnuvz.jpg`,
  sweatRoyalBlueVerso: `${CLOUD}/v1793305028/WhatsApp_Image_2026-10-29_at_21.10.45_3_bgh9ug.jpg`,
  sweatPurpleRecto: `${CLOUD}/v1793310835/12120bb3-b57d-4e75-98dc-9632da0ec185_yp1rlt.jpg`,
  sweatPurpleVerso: `${CLOUD}/v1793310835/695caaa9-f70e-410c-a315-4cc9170bf009_jehxos.jpg`,
  jerseyWhite: `${CLOUD}/v1793310835/31908e1d-4023-4ed0-be80-f3c114bbb097_kz5cef.jpg`,
  jerseyBlack: `${CLOUD}/v1793310836/e2110850-29a4-4e76-aeb4-1972601d467d_cgyeld.jpg`,
  customConfiguratorBanner: `${CLOUD}/v1793947792/10324a1f-74eb-49cc-93b4-f0a118abc4fd_2_qhaxxz.jpg`,
  hoodieZipOutlineRecto: `${CLOUD}/v1793122064/HOODIE_DINGRY_BLACK_ZIPPE%CC%81_OUTLINE_RECTO_iedtrv.png`,
  hoodieZipOutlineVerso: `${CLOUD}/v1793122064/HOODIE_DINGRY_BLACK_ZIPPE%CC%81_OUTLINE_VERSO_ljjxwj.png`,
};

async function patchSupabaseTees(r2: Record<string, string>): Promise<void> {
  const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !key) return;
  const client = createClient(url, key, { auth: { persistSession: false } });

  const patches: Array<{ id: string; recto?: string; verso?: string }> = [
    { id: "13", recto: r2.tee10, verso: r2.tee3 },
    { id: "21", verso: r2.teeBlackVerso },
  ];

  for (const patch of patches) {
    const { data, error } = await client.from("products").select("*").eq("id", patch.id).maybeSingle();
    if (error || !data) continue;
    const product = rowToAdminProduct(data as ProductRow);
    const updates: Partial<ProductRow> = {};
    if (patch.recto) {
      const { imageUrl, objectKey } = await migrateUrlToR2(
        patch.recto,
        `dingry/products/${patch.id}/recto`,
        "recto",
      );
      updates.image_url = imageUrl;
      updates.blob_url = imageUrl;
      updates.blob_pathname = objectKey;
    }
    if (patch.verso) {
      const { imageUrl, objectKey } = await migrateUrlToR2(
        patch.verso,
        `dingry/products/${patch.id}/verso`,
        "verso",
      );
      updates.image_back_url = imageUrl;
      updates.image_back_blob_url = imageUrl;
      updates.image_back_blob_pathname = objectKey;
    }
    if (Object.keys(updates).length === 0) continue;
    const next = adminProductToRow({
      ...product,
      imageUrl: updates.image_url ?? product.imageUrl,
      blobUrl: updates.blob_url ?? product.blobUrl,
      blobPathname: updates.blob_pathname ?? product.blobPathname,
      imageBackUrl: updates.image_back_url ?? product.imageBackUrl,
      imageBackBlobUrl: updates.image_back_blob_url ?? product.imageBackBlobUrl,
      imageBackBlobPathname: updates.image_back_blob_pathname ?? product.imageBackBlobPathname,
    });
    const { error: upErr } = await client.from("products").upsert(next, { onConflict: "id" });
    if (upErr) throw new Error(`[${patch.id}] ${upErr.message}`);
    console.log(`Supabase #${patch.id} recto/verso → R2`);
  }
}

async function main(): Promise<void> {
  if (!isR2ImageStorageEnabled()) throw new Error("R2 non configuré");
  console.log(`R2 : ${r2BaseForLogs()}\n`);
  const r2: Record<string, string> = {};
  for (const [key, source] of Object.entries(LEGACY_SOURCES)) {
    console.log(`→ ${key}`);
    const { imageUrl } = await migrateUrlToR2(source, `dingry/legacy/${key}`, key);
    r2[key] = imageUrl;
    console.log(`  ${imageUrl}`);
  }
  await patchSupabaseTees(r2);
  console.log("\n--- Coller dans le code (dingry-product-media + IMAGES hoodies/tees) ---");
  console.log(JSON.stringify(r2, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
