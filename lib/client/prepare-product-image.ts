import {
  CRM_CONTENT_IMAGE_MAX_BYTES,
  CRM_CONTENT_IMAGE_MAX_LABEL,
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_MAX_LABEL,
} from "@/lib/admin/image-limits";

export type PrepareProductImageOptions = {
  maxSourceBytes?: number;
  maxOutputBytes?: number;
  maxOutputLabel?: string;
  maxEdge?: number;
};
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function renderWebp(bitmap: ImageBitmap, maxEdge: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new Error("Conversion impossible."));
  context.drawImage(bitmap, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Ce navigateur ne peut pas enregistrer en WebP."));
      },
      "image/webp",
      quality,
    );
  });
}

export async function prepareProductImage(
  file: File,
  options?: PrepareProductImageOptions,
): Promise<File> {
  const maxSource = options?.maxSourceBytes ?? PRODUCT_IMAGE_MAX_BYTES;
  const maxOutput = options?.maxOutputBytes ?? PRODUCT_IMAGE_MAX_BYTES;
  const maxLabel = options?.maxOutputLabel ?? PRODUCT_IMAGE_MAX_LABEL;
  const edgeCap = options?.maxEdge ?? 2400;

  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error("Image invalide. Formats acceptés : JPG, PNG, WEBP.");
  }
  if (file.size > maxSource) {
    throw new Error(`Image trop lourde (${maxLabel} maximum).`);
  }

  const bitmap = await createImageBitmap(file);
  try {
    let edge = Math.min(edgeCap, Math.max(bitmap.width, bitmap.height));
    let quality = 0.86;
    let blob = await renderWebp(bitmap, edge, quality);

    while (blob.size > maxOutput && quality > 0.46) {
      quality = Math.round((quality - 0.08) * 100) / 100;
      blob = await renderWebp(bitmap, edge, quality);
    }
    while (blob.size > maxOutput && edge > 720) {
      edge = Math.round(edge * 0.85);
      blob = await renderWebp(bitmap, edge, quality);
    }
    if (blob.size > maxOutput) {
      throw new Error(`Impossible de compresser cette image sous ${maxLabel}.`);
    }

    const base = file.name.replace(/\.[^.]+$/, "").trim() || "produit";
    return new File([blob], `${base}.webp`, { type: "image/webp" });
  } finally {
    bitmap.close();
  }
}
