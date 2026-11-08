import { compressImageToWebp } from "@/lib/supabase/compress-image";
import { isSupabaseStoreEnabled, supabaseAdmin } from "@/lib/supabase/server";

const BUCKET_CANDIDATES = [
  (process.env.SUPABASE_IMAGES_BUCKET ?? "").trim(),
  "dgry-images",
  "dgry images",
].filter((name, index, list) => name.length > 0 && list.indexOf(name) === index);

let resolvedBucket: string | null = null;

export async function imagesBucket(): Promise<string> {
  if (resolvedBucket) return resolvedBucket;
  if (!isSupabaseStoreEnabled()) {
    resolvedBucket = BUCKET_CANDIDATES[0] ?? "dgry-images";
    return resolvedBucket;
  }
  const client = supabaseAdmin();
  for (const name of BUCKET_CANDIDATES) {
    const { data, error } = await client.storage.getBucket(name);
    if (!error && data) {
      resolvedBucket = name;
      return name;
    }
  }
  resolvedBucket = BUCKET_CANDIDATES[0] ?? "dgry-images";
  return resolvedBucket;
}

export type StoredPublicImage = {
  imageUrl: string;
  blobUrl: string | null;
  blobPathname: string | null;
};

export function storageObjectPath(folder: string, fileName: string): string {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${folder.replace(/^\/+|\/+$/g, "")}/${stamp}-${fileName}`;
}

/** @deprecated Images produits : utiliser `lib/r2/storage.ts` (Cloudflare R2). Conservé pour suppression d’anciennes URLs Supabase Storage. */
export async function uploadPublicImage(
  objectPath: string,
  file: File,
): Promise<StoredPublicImage> {
  if (!isSupabaseStoreEnabled()) {
    throw new Error("Supabase Storage indisponible.");
  }
  const bucket = await imagesBucket();
  const source = Buffer.from(await file.arrayBuffer());
  const bytes = await compressImageToWebp(source);
  const { error } = await supabaseAdmin().storage.from(bucket).upload(objectPath, bytes, {
    contentType: "image/webp",
    upsert: false,
  });
  if (error) {
    const message = error.message;
    if (/bucket not found/i.test(message)) {
      throw new Error("Bucket dgry-images introuvable — exécuter supabase/schema.sql dans Supabase.");
    }
    if (/row-level security|policy/i.test(message)) {
      throw new Error("Policy Storage manquante — réexécuter supabase/schema.sql (section storage).");
    }
    throw new Error(message);
  }
  const { data } = supabaseAdmin().storage.from(bucket).getPublicUrl(objectPath);
  const imageUrl = data.publicUrl;
  return { imageUrl, blobUrl: imageUrl, blobPathname: objectPath };
}

export async function removePublicImage(objectPath: string | null | undefined): Promise<void> {
  if (!objectPath || !isSupabaseStoreEnabled()) return;
  if (objectPath.startsWith("dingry/")) return;
  const bucket = await imagesBucket();
  const { error } = await supabaseAdmin().storage.from(bucket).remove([objectPath]);
  if (error) {
    console.error("[storage] suppresssion", error.message);
  }
}

export function isVercelBlobUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("blob.vercel-storage.com") || url.includes("vercel-storage.com");
}
