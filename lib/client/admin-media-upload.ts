import {
  uploadAdminImageToR2,
  type AdminImageUploadResponse,
} from "@/lib/client/admin-upload-image";
import {
  CRM_CONTENT_IMAGE_MAX_BYTES,
  CRM_CONTENT_IMAGE_MAX_LABEL,
  CRM_CONTENT_IMAGE_MAX_SOURCE_BYTES,
  CRM_CONTENT_IMAGE_MAX_SOURCE_LABEL,
} from "@/lib/admin/image-limits";
import {
  prepareProductImage,
  type PrepareProductImageOptions,
} from "@/lib/client/prepare-product-image";

type PrepareAndUploadOptions = {
  folder?: string;
  productId?: string | null;
  face?: "recto" | "verso";
  /** Lookbook / bannière : WebP navigateur · 8 Mo max après conversion. */
  contentImage?: boolean;
};

export type PrepareAndUploadResult =
  | { ok: true; uploaded: AdminImageUploadResponse; file: null }
  | { ok: true; uploaded: null; file: File }
  | { ok: false; error: string };

/** WebP puis POST `/api/upload` ; repli fichier si R2 indisponible. */
export async function prepareAndUploadAdminImage(
  source: File,
  options?: PrepareAndUploadOptions,
): Promise<PrepareAndUploadResult> {
  try {
    const compress: PrepareProductImageOptions | undefined = options?.contentImage
      ? {
          maxSourceBytes: CRM_CONTENT_IMAGE_MAX_SOURCE_BYTES,
          maxSourceLabel: CRM_CONTENT_IMAGE_MAX_SOURCE_LABEL,
          maxOutputBytes: CRM_CONTENT_IMAGE_MAX_BYTES,
          maxOutputLabel: CRM_CONTENT_IMAGE_MAX_LABEL,
          maxEdge: 2400,
        }
      : undefined;
    const prepared = await prepareProductImage(source, compress);
    try {
      const uploaded = await uploadAdminImageToR2(prepared, options);
      return { ok: true, uploaded, file: null };
    } catch (error) {
      console.warn(
        "[admin-media-upload] upload R2 en échec, repli multipart",
        error instanceof Error ? error.message : error,
      );
      return { ok: true, uploaded: null, file: prepared };
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Image invalide ou conversion impossible.",
    };
  }
}
