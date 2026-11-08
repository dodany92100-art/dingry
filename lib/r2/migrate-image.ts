import { compressImageToWebp } from "@/lib/supabase/compress-image";
import { isR2PublicUrl, r2PublicBaseUrl } from "@/lib/r2/config";
import { isR2ImageStorageEnabled, r2ObjectKey, uploadR2PublicImage } from "@/lib/r2/storage";

export function shouldMigrateImageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || trimmed === "/dingry-draft-product.svg") return false;
  if (isR2PublicUrl(trimmed)) return false;
  if (trimmed.startsWith("/admin-uploads/")) return false;
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
}

export function isLegacyVercelBlobUrl(url: string): boolean {
  return url.includes("blob.vercel-storage.com") || url.includes("vercel-storage.com");
}

export function isSupabasePublicStorageUrl(url: string): boolean {
  return url.includes(".supabase.co/storage/v1/object/public/");
}

export async function downloadImageBytes(url: string): Promise<Buffer> {
  const response = await fetch(url, { redirect: "follow", cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Téléchargement ${response.status} pour ${url}`);
  }
  const array = await response.arrayBuffer();
  return Buffer.from(array);
}

export async function migrateUrlToR2(
  sourceUrl: string,
  objectFolder: string,
  fileLabel: string,
): Promise<{ imageUrl: string; objectKey: string }> {
  if (!isR2ImageStorageEnabled()) {
    throw new Error("R2 non configuré.");
  }
  const bytes = await downloadImageBytes(sourceUrl);
  const webp = await compressImageToWebp(bytes);
  const key = r2ObjectKey(objectFolder, `${fileLabel}.webp`);
  const file = new File([webp], `${fileLabel}.webp`, { type: "image/webp" });
  const stored = await uploadR2PublicImage(key, file);
  if (!stored.blobPathname) {
    throw new Error("Clé R2 absente après upload.");
  }
  return { imageUrl: stored.imageUrl, objectKey: stored.blobPathname };
}

export function r2BaseForLogs(): string {
  return r2PublicBaseUrl();
}

export { isR2ImageStorageEnabled } from "@/lib/r2/config";
