import { revalidatePath } from "next/cache";
import { isBlobConfigured, requireAdmin } from "@/lib/admin/auth";
import { parseCatalogPersoBannerFields } from "@/lib/admin/parse-catalog-perso-banner";
import {
  loadStoreReadOnly,
  StoreConflictError,
  StoreUnavailableError,
  upsertCatalogPersoBanner,
  validateImageFile,
} from "@/lib/admin/store";
import { resolveAdminCatalogPersoBanner } from "@/lib/catalog-perso-banner";
import { jsonNoStore } from "@/lib/http";

export const runtime = "nodejs";

function revalidateCatalogPersoBanner() {
  revalidatePath("/");
  revalidatePath("/api/catalog-perso-banner");
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const store = await loadStoreReadOnly();
    const banner = resolveAdminCatalogPersoBanner(store.catalogPersoBanner);
    return jsonNoStore({
      banner,
      customized: Boolean(store.catalogPersoBanner),
      blobEnabled: isBlobConfigured(),
    });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      return jsonNoStore({ error: "Enregistrement indisponible." }, { status: 503 });
    }
    return jsonNoStore({ error: "Impossible de charger la bannière." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

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
  const file = image instanceof File && image.size > 0 ? image : undefined;
  if (file) {
    const imageError = validateImageFile(file);
    if (imageError) {
      return jsonNoStore({ error: imageError }, { status: 400 });
    }
  }

  try {
    const banner = await upsertCatalogPersoBanner(
      { enabled, eyebrow, title, subtitle, ctaLabel },
      file,
    );
    revalidateCatalogPersoBanner();
    return jsonNoStore({ banner });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      return jsonNoStore({ error: "Enregistrement indisponible." }, { status: 503 });
    }
    if (error instanceof StoreConflictError) {
      return jsonNoStore({ error: "Conflit d'enregistrement. Réessayez." }, { status: 503 });
    }
    return jsonNoStore({ error: "Impossible d'enregistrer la bannière." }, { status: 500 });
  }
}
