import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import {
  adminCrmMediaBackendGuard,
  respondAdminCrmWriteError,
} from "@/lib/admin/admin-crm-route";
import { parseLookbookFields } from "@/lib/admin/parse-lookbook";
import {
  loadStoreReadOnly,
  removeLookbookSlide,
  reorderLookbookSlide,
  updateLookbookSlide,
  validateCrmContentImageFile,
} from "@/lib/admin/store";
import { preuploadedRectoFromForm } from "@/lib/admin/preuploaded-image";
import { jsonNoStore } from "@/lib/http";

export const runtime = "nodejs";

function revalidateLookbook() {
  revalidatePath("/");
  revalidatePath("/api/lookbook");
  revalidatePath("/api/banners");
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const blocked = adminCrmMediaBackendGuard();
  if (blocked) return blocked;

  const { id } = await params;
  if (!id) {
    return jsonNoStore({ error: "Slide introuvable." }, { status: 404 });
  }

  try {
    const store = await loadStoreReadOnly();
    const current = store.lookbook.find((item) => item.id === id);
    if (!current) {
      return jsonNoStore({ error: "Slide introuvable." }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      let body: Record<string, unknown>;
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch {
        return jsonNoStore({ error: "Corps JSON invalide." }, { status: 400 });
      }

      if (body.reorder === "up" || body.reorder === "down") {
        const slides = await reorderLookbookSlide(id, body.reorder);
        if (!slides) {
          return jsonNoStore({ error: "Slide introuvable." }, { status: 404 });
        }
        revalidateLookbook();
        return jsonNoStore({ slides });
      }
    }

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const parsed = parseLookbookFields(formData, { partial: true });
      if (parsed.error) {
        return jsonNoStore({ error: parsed.error }, { status: 400 });
      }

      const image = formData.get("image");
      const preuploadedImage = preuploadedRectoFromForm(formData);
      let file: File | undefined;
      if (image instanceof File && image.size > 0) {
        const imageError = validateCrmContentImageFile(image);
        if (imageError) {
          return jsonNoStore({ error: imageError }, { status: 400 });
        }
        file = image;
      }

      const slide = await updateLookbookSlide(
        id,
        {
          title: parsed.fields.title,
          caption: parsed.fields.caption,
          sortOrder: parsed.fields.sortOrder,
          preuploadedImage: preuploadedImage ?? undefined,
        },
        file,
      );
      if (!slide) {
        return jsonNoStore({ error: "Slide introuvable." }, { status: 404 });
      }
      revalidateLookbook();
      return jsonNoStore({ slide });
    }

    return jsonNoStore({ error: "Requête non supportée." }, { status: 400 });
  } catch (error) {
    return respondAdminCrmWriteError(error, "admin lookbook PATCH", "Impossible de mettre à jour la slide.");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const blocked = adminCrmMediaBackendGuard();
  if (blocked) return blocked;

  const { id } = await params;
  if (!id) {
    return jsonNoStore({ error: "Slide introuvable." }, { status: 404 });
  }

  try {
    const removed = await removeLookbookSlide(id);
    if (!removed) {
      return jsonNoStore({ error: "Slide introuvable." }, { status: 404 });
    }
    revalidateLookbook();
    return jsonNoStore({ ok: true });
  } catch (error) {
    return respondAdminCrmWriteError(error, "admin lookbook DELETE", "Impossible de supprimer la slide.");
  }
}
