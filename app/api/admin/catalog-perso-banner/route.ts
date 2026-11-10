import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import {
  adminCrmBackendFlags,
  adminCrmMediaBackendGuard,
  respondAdminCrmReadError,
  respondAdminCrmWriteError,
} from "@/lib/admin/admin-crm-route";
import { parseCatalogPersoBannerFields } from "@/lib/admin/parse-catalog-perso-banner";
import {
  loadStoreReadOnly,
  upsertCatalogPersoBanner,
  validateCrmContentImageFile,
} from "@/lib/admin/store";
import { resolveAdminCatalogPersoBanner } from "@/lib/catalog-perso-banner";
import { persoBannerImageFromForm, preuploadedRectoFromForm } from "@/lib/admin/preuploaded-image";
import { jsonNoStore } from "@/lib/http";

export const runtime = "nodejs";

function revalidateCatalogPersoBanner() {
  revalidatePath("/");
  revalidatePath("/api/catalog-perso-banner");
  revalidatePath("/api/banners");
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const blocked = adminCrmMediaBackendGuard();
  if (blocked) return blocked;

  try {
    const store = await loadStoreReadOnly();
    const banner = resolveAdminCatalogPersoBanner(store.catalogPersoBanner);
    return jsonNoStore({
      banner,
      customized: Boolean(store.catalogPersoBanner),
      ...adminCrmBackendFlags(),
    });
  } catch (error) {
    return respondAdminCrmReadError(error, "admin catalog-perso-banner GET", "Impossible de charger la bannière.");
  }
}

export async function PATCH(request: Request) {
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

  const parsed = parseCatalogPersoBannerFields(formData);
  if (parsed.error) {
    return jsonNoStore({ error: parsed.error }, { status: 400 });
  }

  const { enabled, eyebrow, title, subtitle, ctaLabel } = parsed.fields;
  if (
    enabled === undefined ||
    !eyebrow ||
    !title ||
    !subtitle ||
    !ctaLabel
  ) {
    return jsonNoStore({ error: "Champs incomplets." }, { status: 400 });
  }

  const image = formData.get("image");
  const preuploadedImage = preuploadedRectoFromForm(formData);
  const persistedImage = persoBannerImageFromForm(formData);
  const file = image instanceof File && image.size > 0 ? image : undefined;
  if (file) {
    const imageError = validateCrmContentImageFile(file);
    if (imageError) {
      return jsonNoStore({ error: imageError }, { status: 400 });
    }
  }

  try {
    const banner = await upsertCatalogPersoBanner(
      { enabled, eyebrow, title, subtitle, ctaLabel },
      file,
      preuploadedImage,
      persistedImage,
    );
    revalidateCatalogPersoBanner();
    return jsonNoStore({ banner });
  } catch (error) {
    return respondAdminCrmWriteError(
      error,
      "admin catalog-perso-banner PATCH",
      "Impossible d'enregistrer la bannière.",
    );
  }
}
