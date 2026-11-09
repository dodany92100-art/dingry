import { isR2ImageStorageEnabled, requireAdmin } from "@/lib/admin/auth";
import { listPriceFamilies, registerPriceFamily, StoreConflictError, StoreUnavailableError } from "@/lib/admin/store";
import { PriceFamilyDuplicateError } from "@/lib/admin/store-errors";
import { jsonNoStore } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const priceFamilies = await listPriceFamilies();
    return jsonNoStore({ priceFamilies, r2ImageStorage: isR2ImageStorageEnabled() });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      return jsonNoStore({ error: "Registre familles indisponible." }, { status: 503 });
    }
    console.error("price-families GET", error instanceof Error ? error.name : "erreur");
    return jsonNoStore({ error: "Impossible de charger les familles de prix." }, { status: 500 });
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
    const family = await registerPriceFamily(body);
    return jsonNoStore({ family }, { status: 201 });
  } catch (error) {
    if (error instanceof PriceFamilyDuplicateError) {
      return jsonNoStore({ error: error.message }, { status: 409 });
    }
    if (error instanceof StoreConflictError) {
      return jsonNoStore({ error: "Conflit d'enregistrement. Réessayez." }, { status: 503 });
    }
    if (error instanceof StoreUnavailableError) {
      return jsonNoStore({ error: error.message }, { status: 503 });
    }
    console.error("price-families POST", error instanceof Error ? error.name : "erreur");
    return jsonNoStore({ error: "Enregistrement famille impossible." }, { status: 500 });
  }
}
