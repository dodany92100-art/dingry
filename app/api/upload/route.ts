import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/admin/auth";
import { validateCrmContentImageFile, validateImageFile } from "@/lib/admin/store";
import { jsonNoStore } from "@/lib/http";
import { isR2ImageStorageEnabled, r2ObjectKey, uploadR2PublicImage } from "@/lib/r2";

export const runtime = "nodejs";

type ImageFace = "recto" | "verso";

function resolveFolder(formData: FormData, request: Request): string | null {
  const folder = String(formData.get("folder") ?? "").trim();
  if (folder) return folder.replace(/^\/+|\/+$/g, "");
  const url = new URL(request.url);
  const custom = String(url.searchParams.get("folder") ?? "").trim();
  if (custom) return custom.replace(/^\/+|\/+$/g, "");
  const productId = String(formData.get("productId") ?? url.searchParams.get("productId") ?? "").trim();
  const faceRaw = String(formData.get("face") ?? url.searchParams.get("face") ?? "recto").trim();
  const face: ImageFace = faceRaw === "verso" ? "verso" : "recto";
  if (productId) return `dingry/products/${productId}/${face}`;
  return `dingry/products/staging/${randomUUID()}/${face}`;
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  if (!isR2ImageStorageEnabled()) {
    return jsonNoStore({ error: "Stockage R2 non configuré." }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonNoStore({ error: "Formulaire invalide." }, { status: 400 });
  }

  const file = formData.get("file") ?? formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return jsonNoStore({ error: "Fichier image manquant." }, { status: 400 });
  }

  const folder = resolveFolder(formData, request);
  if (!folder) {
    return jsonNoStore({ error: "Dossier cible invalide." }, { status: 400 });
  }
  const contentImage = folder.includes("lookbook") || folder.includes("banner");
  const imageError = contentImage ? validateCrmContentImageFile(file) : validateImageFile(file);
  if (imageError) {
    return jsonNoStore({ error: imageError }, { status: 400 });
  }

  const fileName = file.name.toLowerCase().endsWith(".webp") ? file.name : `${file.name.replace(/\.[^.]+$/, "")}.webp`;
  const key = r2ObjectKey(folder, fileName);

  try {
    const stored = await uploadR2PublicImage(key, file);
    return jsonNoStore({
      url: stored.imageUrl,
      pathname: stored.blobPathname,
      data: { url: stored.imageUrl, pathname: stored.blobPathname },
    });
  } catch (error) {
    console.error("[upload]", error instanceof Error ? error.message : "erreur");
    return jsonNoStore({ error: "Échec de l’upload R2." }, { status: 500 });
  }
}
