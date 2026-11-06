import { revalidatePath } from "next/cache";
import { isBlobConfigured, requireAdmin } from "@/lib/admin/auth";
import { parseLookbookFields } from "@/lib/admin/parse-lookbook";
import {
  createLookbookSlide,
  loadStoreReadOnly,
  StoreConflictError,
  StoreUnavailableError,
  validateImageFile,
} from "@/lib/admin/store";
import { jsonNoStore } from "@/lib/http";

export const runtime = "nodejs";

function revalidateLookbook() {
  revalidatePath("/");
  revalidatePath("/api/lookbook");
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const store = await loadStoreReadOnly();
    const slides = [...store.lookbook].sort((a, b) => a.sortOrder - b.sortOrder);
    return jsonNoStore({ slides, blobEnabled: isBlobConfigured() });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      return jsonNoStore({ error: "Enregistrement indisponible." }, { status: 503 });
    }
    return jsonNoStore({ error: "Impossible de charger le lookbook." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

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
  if (!(image instanceof File) || image.size === 0) {
    return jsonNoStore({ error: "Une image est requise." }, { status: 400 });
  }

  const imageError = validateImageFile(image);
  if (imageError) {
    return jsonNoStore({ error: imageError }, { status: 400 });
  }

  try {
    const slide = await createLookbookSlide({
      title: parsed.fields.title,
      caption: parsed.fields.caption ?? "",
      sortOrder: parsed.fields.sortOrder,
      file: image,
    });
    revalidateLookbook();
    return jsonNoStore({ slide }, { status: 201 });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      return jsonNoStore({ error: "Enregistrement indisponible." }, { status: 503 });
    }
    if (error instanceof StoreConflictError) {
      return jsonNoStore({ error: "Conflit d'enregistrement. Réessayez." }, { status: 503 });
    }
    return jsonNoStore({ error: "Impossible d'enregistrer la slide." }, { status: 500 });
  }
}
