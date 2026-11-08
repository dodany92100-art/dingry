import {
  uploadAdminImageToR2,
  type AdminImageUploadResponse,
} from "@/lib/client/admin-upload-image";
import { prepareProductImage } from "@/lib/client/prepare-product-image";

type PrepareAndUploadOptions = {
  folder?: string;
  productId?: string | null;
  face?: "recto" | "verso";
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
    const prepared = await prepareProductImage(source);
    try {
      const uploaded = await uploadAdminImageToR2(prepared, options);
      return { ok: true, uploaded, file: null };
    } catch {
      return { ok: true, uploaded: null, file: prepared };
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Image invalide ou conversion impossible.",
    };
  }
}
