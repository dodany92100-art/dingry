import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import {
  adminCrmBackendFlags,
  adminCrmMediaBackendGuard,
  respondAdminCrmReadError,
  respondAdminCrmWriteError,
} from "@/lib/admin/admin-crm-route";
import { parseLookbookFields } from "@/lib/admin/parse-lookbook";
import {
  adminLookbookSlideViews,
  createLookbookSlide,
  loadStoreReadOnly,
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

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const blocked = adminCrmMediaBackendGuard();
  if (blocked) return blocked;

  try {
    const store = await loadStoreReadOnly();
    const slides = adminLookbookSlideViews(store);
    return jsonNoStore({ slides, ...adminCrmBackendFlags() });
  } catch (error) {
    return respondAdminCrmReadError(error, "admin lookbook GET", "Impossible de charger le lookbook.");
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const blocked = adminCrmMediaBackendGuard();
  if (blocked) return blocked;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonNoStore({ error: "Formulaire invalide." }, { status: 400 });
  }

  const parsed = parseLookbookFields(formData);
  if (parsed.error || !parsed.fields.title) {
    return jsonNoStore({ error: parsed.error || "Champs invalides." }, { status: 400 });
  }

  const image = formData.get("image");
  const preuploadedImage = preuploadedRectoFromForm(formData);
  const hasFile = image instanceof File && image.size > 0;
  if (!hasFile && !preuploadedImage) {
    return jsonNoStore({ error: "Une image R2 est requise (upload ou preupload)." }, { status: 400 });
  }

  if (hasFile) {
    const imageError = validateCrmContentImageFile(image as File);
    if (imageError) {
      return jsonNoStore({ error: imageError }, { status: 400 });
    }
  }

  try {
    const slide = await createLookbookSlide({
      title: parsed.fields.title,
      caption: parsed.fields.caption ?? "",
      sortOrder: parsed.fields.sortOrder,
      file: hasFile ? (image as File) : undefined,
      preuploadedImage,
    });
    revalidateLookbook();
    return jsonNoStore({ slide }, { status: 201 });
  } catch (error) {
    return respondAdminCrmWriteError(error, "admin lookbook POST", "Impossible d'enregistrer la slide.");
  }
}
