export type AdminImageUploadResponse = {
  url: string;
  pathname: string | null;
};

type UploadOptions = {
  productId?: string | null;
  face?: "recto" | "verso";
  folder?: string;
};

export async function uploadAdminImageToR2(file: File, options?: UploadOptions): Promise<AdminImageUploadResponse> {
  const formData = new FormData();
  formData.set("file", file);
  if (options?.productId) formData.set("productId", options.productId);
  if (options?.face) formData.set("face", options.face);
  if (options?.folder) formData.set("folder", options.folder);

  const response = await fetch("/api/upload", { method: "POST", body: formData, credentials: "same-origin" });
  const payload = (await response.json().catch(() => ({}))) as {
    url?: string;
    pathname?: string | null;
    data?: { url?: string; pathname?: string | null };
    error?: string;
  };

  if (!response.ok) {
    throw new Error(typeof payload.error === "string" ? payload.error : "Upload impossible.");
  }

  const url = payload.url ?? payload.data?.url ?? "";
  if (!url) throw new Error("Réponse upload invalide.");
  const pathname = payload.pathname ?? payload.data?.pathname ?? null;
  return { url, pathname };
}

/** Champs attendus par `preuploadedRectoFromForm` côté API. */
export function appendPreuploadedImageFields(
  formData: FormData,
  uploaded: AdminImageUploadResponse | null | undefined,
): void {
  if (!uploaded?.url) return;
  formData.set("imageUrl", uploaded.url);
  if (uploaded.pathname) formData.set("imageBlobPathname", uploaded.pathname);
}

export const R2_LOOKBOOK_FOLDER = (slideId: string) => `dingry/lookbook/${slideId}`;
export const R2_LOOKBOOK_STAGING_FOLDER = `dingry/lookbook/staging`;
export const R2_PERSO_BANNER_FOLDER = `dingry/banner/perso`;
