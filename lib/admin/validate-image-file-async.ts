import { isWebpBuffer, webpHeaderError } from "@/lib/admin/image-webp-sniff";
import { validateCrmContentImageFile, validateImageFile } from "@/lib/admin/store";

/** MIME + en-tête RIFF/WEBP (12 octets) avant enregistrement. */
export async function validateImageFileAsync(file: File, contentImage = false): Promise<string | null> {
  const mimeError = contentImage ? validateCrmContentImageFile(file) : validateImageFile(file);
  if (mimeError) return mimeError;
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!isWebpBuffer(header)) return webpHeaderError();
  return null;
}