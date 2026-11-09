import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { compressImageToWebp } from "@/lib/supabase/compress-image";
import {
  isR2ImageStorageEnabled,
  isR2PublicUrl,
  objectKeyFromR2PublicUrl,
  r2BucketName,
  r2CredentialFormatError,
  r2PublicUrlForKey,
  r2S3Endpoint,
} from "@/lib/r2/config";

export { isR2ImageStorageEnabled } from "@/lib/r2/config";

export type R2StoredImage = {
  imageUrl: string;
  blobUrl: string | null;
  blobPathname: string | null;
};

let cachedClient: S3Client | null = null;

function r2Client(): S3Client {
  const accessKeyId = (process.env.R2_ACCESS_KEY_ID ?? "").trim();
  const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY ?? "").trim();
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("R2 : R2_ACCESS_KEY_ID et R2_SECRET_ACCESS_KEY requis.");
  }
  const formatError = r2CredentialFormatError();
  if (formatError) {
    throw new Error(`R2 : ${formatError}`);
  }
  cachedClient ??= new S3Client({
    region: "auto",
    endpoint: r2S3Endpoint(),
    credentials: { accessKeyId, secretAccessKey },
  });
  return cachedClient;
}

export function r2ObjectKey(folder: string, fileName: string): string {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const safeFolder = folder.replace(/^\/+|\/+$/g, "");
  return `${safeFolder}/${stamp}-${fileName}`;
}

export async function uploadR2PublicImage(objectKey: string, file: File): Promise<R2StoredImage> {
  if (!isR2ImageStorageEnabled()) {
    throw new Error("Stockage R2 non configuré.");
  }
  const key = objectKey.replace(/^\/+/, "");
  const bytes = await compressImageToWebp(Buffer.from(await file.arrayBuffer()));
  await r2Client().send(
    new PutObjectCommand({
      Bucket: r2BucketName(),
      Key: key,
      Body: bytes,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  const imageUrl = r2PublicUrlForKey(key);
  return { imageUrl, blobUrl: imageUrl, blobPathname: key };
}

export async function deleteR2Object(objectKey: string | null | undefined): Promise<void> {
  if (!objectKey?.trim() || !isR2ImageStorageEnabled()) return;
  const key = objectKey.replace(/^\/+/, "");
  try {
    await r2Client().send(
      new DeleteObjectCommand({
        Bucket: r2BucketName(),
        Key: key,
      }),
    );
  } catch (error) {
    console.error("[r2] delete", error instanceof Error ? error.message : "erreur");
  }
}

export async function deleteR2PublicImage(
  imageUrl: string,
  objectKey: string | null | undefined,
): Promise<void> {
  if (!isR2PublicUrl(imageUrl) && !objectKey) return;
  const key = objectKey?.trim() || objectKeyFromR2PublicUrl(imageUrl);
  if (key) await deleteR2Object(key);
}
