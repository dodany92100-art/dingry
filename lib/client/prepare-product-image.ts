const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 1 * 1024 * 1024;
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

export async function prepareProductImage(file: File): Promise<File> {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error("Image invalide. Formats acceptés : JPG, PNG, WEBP.");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("Image trop lourde (10 Mo maximum).");
  }

  const bitmap = await createImageBitmap(file);
  try {
    let edge = Math.min(2400, Math.max(bitmap.width, bitmap.height));
    let quality = 0.86;
    let blob = await renderWebp(bitmap, edge, quality);

    while (blob.size > MAX_OUTPUT_BYTES && quality > 0.46) {
      quality = Math.round((quality - 0.08) * 100) / 100;
      blob = await renderWebp(bitmap, edge, quality);
    }
    while (blob.size > MAX_OUTPUT_BYTES && edge > 900) {
      edge = Math.round(edge * 0.85);
      blob = await renderWebp(bitmap, edge, quality);
    }
    if (blob.size > MAX_OUTPUT_BYTES) {
      throw new Error("Impossible de compresser cette image sous 1 Mo.");
    }

    const base = file.name.replace(/\.[^.]+$/, "").trim() || "produit";
    return new File([blob], `${base}.webp`, { type: "image/webp" });
  } finally {
    bitmap.close();
  }
}
