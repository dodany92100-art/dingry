/**
 * Migre les `image_url` / `image_back_url` Supabase vers Cloudflare R2.
 * Usage :
 *   npx tsx scripts/migrate-product-images-to-r2.ts --dry-run
 *   npx tsx scripts/migrate-product-images-to-r2.ts --limit 20
 *   npx tsx scripts/migrate-product-images-to-r2.ts --id 42
 */
import { config } from "dotenv";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { adminProductToRow, rowToAdminProduct, type ProductRow } from "../lib/supabase/product-row";
import {
  isLegacyVercelBlobUrl,
  isR2ImageStorageEnabled,
  isSupabasePublicStorageUrl,
  migrateUrlToR2,
  r2BaseForLogs,
  shouldMigrateImageUrl,
} from "../lib/r2/migrate-image";

config({ path: path.join(process.cwd(), ".env") });
config({ path: path.join(process.cwd(), ".env.local"), override: true });

type CliOptions = {
  dryRun: boolean;
  limit: number | null;
  productId: string | null;
  skipCloudinary: boolean;
  liveOnly: boolean;
};

function parseCli(argv: string[]): CliOptions {
  let dryRun = false;
  let limit: number | null = null;
  let productId: string | null = null;
  let skipCloudinary = false;
  let liveOnly = false;
  for (const arg of argv) {
    if (arg === "--dry-run") dryRun = true;
    else if (arg.startsWith("--limit=")) limit = Number(arg.slice("--limit=".length)) || null;
    else if (arg.startsWith("--id=")) productId = arg.slice("--id=".length).trim() || null;
    else if (arg === "--skip-cloudinary") skipCloudinary = true;
    else if (arg === "--live-only") liveOnly = true;
  }
  return { dryRun, limit, productId, skipCloudinary, liveOnly };
}

function isCloudinaryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com/");
}

async function main(): Promise<void> {
  const options = parseCli(process.argv.slice(2));
  const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY requis.");
  }
  if (!isR2ImageStorageEnabled()) {
    throw new Error(
      "R2 non configuré : R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_BASE_URL",
    );
  }

  console.log(`R2 public : ${r2BaseForLogs()}`);
  if (options.dryRun) console.log("Mode dry-run (aucune écriture).");

  const client = createClient(url, key, { auth: { persistSession: false } });
  const query = client.from("products").select("*").order("id", { ascending: true });
  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let rows = (data ?? []) as ProductRow[];
  if (options.liveOnly) {
    rows = rows.filter((row) => String(row.publish_status).toLowerCase() === "live");
  }
  if (options.productId) {
    rows = rows.filter((row) => String(row.id) === options.productId);
  }
  if (options.limit !== null) {
    rows = rows.slice(0, options.limit);
  }

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const product = rowToAdminProduct(row);
    const updates: Partial<ProductRow> = {};
    const faces: Array<{
      field: "image_url" | "image_back_url";
      pathField: "blob_pathname" | "image_back_blob_pathname";
      urlField: "blob_url" | "image_back_blob_url";
      current: string;
      folder: string;
      label: string;
    }> = [
      {
        field: "image_url",
        pathField: "blob_pathname",
        urlField: "blob_url",
        current: product.imageUrl,
        folder: `dingry/products/${product.id}/recto`,
        label: "recto",
      },
      {
        field: "image_back_url",
        pathField: "image_back_blob_pathname",
        urlField: "image_back_blob_url",
        current: product.imageBackUrl,
        folder: `dingry/products/${product.id}/verso`,
        label: "verso",
      },
    ];

    for (const face of faces) {
      const src = face.current.trim();
      if (!shouldMigrateImageUrl(src)) continue;
      if (options.skipCloudinary && isCloudinaryUrl(src)) {
        skipped += 1;
        console.log(`skip cloudinary ${product.id} ${face.label}`);
        continue;
      }
      const tag = `[${product.id}] ${product.sku} ${face.label}`;
      if (isLegacyVercelBlobUrl(src)) {
        console.log(`${tag} ← Vercel Blob`);
      } else if (isSupabasePublicStorageUrl(src)) {
        console.log(`${tag} ← Supabase Storage`);
      }
      if (options.dryRun) {
        console.log(`${tag} → R2 (simulation)`);
        migrated += 1;
        continue;
      }
      try {
        const { imageUrl, objectKey } = await migrateUrlToR2(src, face.folder, face.label);
        updates[face.field] = imageUrl;
        updates[face.pathField] = objectKey;
        updates[face.urlField] = imageUrl;
        migrated += 1;
        console.log(`${tag} ok → ${imageUrl}`);
      } catch (migrateError) {
        failed += 1;
        console.error(
          `${tag} échec`,
          migrateError instanceof Error ? migrateError.message : "erreur",
        );
      }
    }

    if (!options.dryRun && Object.keys(updates).length > 0) {
      const next = adminProductToRow({ ...product, ...rowToPatch(product, updates) });
      const { error: upsertError } = await client.from("products").upsert(next, { onConflict: "id" });
      if (upsertError) {
        failed += 1;
        console.error(`[${product.id}] upsert`, upsertError.message);
      }
    }
  }

  console.log(`Terminé. migrés=${migrated} ignorés=${skipped} échecs=${failed}`);
}

function rowToPatch(product: ReturnType<typeof rowToAdminProduct>, updates: Partial<ProductRow>) {
  return {
    ...product,
    imageUrl: updates.image_url ?? product.imageUrl,
    blobUrl: updates.blob_url ?? product.blobUrl,
    blobPathname: updates.blob_pathname ?? product.blobPathname,
    imageBackUrl: updates.image_back_url ?? product.imageBackUrl,
    imageBackBlobUrl: updates.image_back_blob_url ?? product.imageBackBlobUrl,
    imageBackBlobPathname: updates.image_back_blob_pathname ?? product.imageBackBlobPathname,
  };
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
