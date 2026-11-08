/** Point d’entrée R2 (S3) — utilisé par `app/api/upload` et le CRM admin. */
export {
  isR2ImageStorageEnabled,
  isR2PublicUrl,
  R2_DEFAULT_BUCKET_NAME,
  r2PublicBaseUrl,
  r2BucketName,
} from "@/lib/r2/config";

export {
  deleteR2PublicImage,
  r2ObjectKey,
  uploadR2PublicImage,
  type R2StoredImage,
} from "@/lib/r2/storage";
