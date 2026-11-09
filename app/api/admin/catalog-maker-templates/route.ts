import { isR2ImageStorageEnabled, requireAdmin } from "@/lib/admin/auth";
import { listMakerTemplates, registerMakerTemplate, StoreConflictError, StoreUnavailableError } from "@/lib/admin/store";
import { CatalogMakerDuplicateError } from "@/lib/admin/store-errors";
import { jsonNoStore } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const makerTemplates = await listMakerTemplates();
    return jsonNoStore({ makerTemplates, r2ImageStorage: isR2ImageStorageEnabled() });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      return jsonNoStore({ error: "Catalogue maker indisponible." }, { status: 503 });
    }
    return jsonNoStore({ error: "Impossible de charger les modèles." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonNoStore({ error: "JSON invalide." }, { status: 400 });
  }

  try {
    const template = await registerMakerTemplate(body);
    return jsonNoStore({ template }, { status: 201 });
  } catch (error) {
    if (error instanceof CatalogMakerDuplicateError) {
      return jsonNoStore({ error: error.message }, { status: 409 });
    }
    if (error instanceof StoreConflictError) {
      return jsonNoStore({ error: "Conflit d'enregistrement. Réessayez." }, { status: 503 });
    }
    if (error instanceof StoreUnavailableError) {
      return jsonNoStore({ error: error.message }, { status: 503 });
    }
    return jsonNoStore({ error: "Enregistrement modèle impossible." }, { status: 500 });
  }
}
