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
  DEFAULT_PERSO_BANNER_FOCUS_X,
  DEFAULT_PERSO_BANNER_FOCUS_Y,
} from "@/lib/catalog-perso-banner-focus";
import { buildPersoBannerCityVisuals } from "@/lib/admin/build-perso-banner-city-visuals";
import {
  loadStoreReadOnly,
  uploadCatalogPersoBannerCityImage,
  upsertCatalogPersoBanner,
  validateCrmContentImageFile,
} from "@/lib/admin/store";
import { PERSO_BANNER_CITY_IDS } from "@/lib/catalog-perso-banner-cities";
import { persoBannerCityFormPrefix } from "@/lib/catalog-perso-banner-cities";
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

  const { enabled, eyebrow, title, subtitle, ctaLabel, imageFocusX, imageFocusY } = parsed.fields;
  if (
    enabled === undefined ||
    !eyebrow ||
    !title ||
    !subtitle ||
    !ctaLabel
  ) {
    return jsonNoStore({ error: "Champs incomplets." }, { status: 400 });
  }

  const focusX = imageFocusX ?? DEFAULT_PERSO_BANNER_FOCUS_X;
  const focusY = imageFocusY ?? DEFAULT_PERSO_BANNER_FOCUS_Y;

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

  for (const cityId of PERSO_BANNER_CITY_IDS) {
    const prefix = persoBannerCityFormPrefix(cityId);
    const cityImage = formData.get(`${prefix}_image`);
    if (cityImage instanceof File && cityImage.size > 0) {
      const imageError = validateCrmContentImageFile(cityImage);
      if (imageError) {
        return jsonNoStore({ error: `${cityId.toUpperCase()} : ${imageError}` }, { status: 400 });
      }
    }
  }

  try {
    const store = await loadStoreReadOnly();
    const cityVisuals = await buildPersoBannerCityVisuals({
      formData,
      previous: store.catalogPersoBanner?.cityVisuals,
      uploadCity: (cityFile, cityId) => uploadCatalogPersoBannerCityImage(cityId, cityFile),
    });

    const clearMainImage = formData.get("imageClear") === "true";

    const banner = await upsertCatalogPersoBanner(
      {
        enabled,
        eyebrow,
        title,
        subtitle,
        ctaLabel,
        imageFocusX: focusX,
        imageFocusY: focusY,
        clearMainImage,
      },
      file,
      preuploadedImage,
      persistedImage,
      cityVisuals,
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
