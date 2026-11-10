import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import {
  adminCrmBackendFlags,
  respondAdminCrmReadError,
  respondAdminCrmWriteError,
} from "@/lib/admin/admin-crm-route";
import { parseAtelierCustomJson, serializeAtelierCustomConfig } from "@/lib/admin/parse-atelier-custom";
import {
  resolveShopAtelierCustomConfig,
  SHOP_ATELIER_CUSTOM_DEFAULT,
  type AdminAtelierCustomConfig,
} from "@/lib/atelier-custom-config";
import { jsonNoStore } from "@/lib/http";
import { readSupabaseAtelierCustomJson, upsertSupabaseAtelierCustomJson } from "@/lib/supabase/shop-banners";

export const runtime = "nodejs";

function revalidateAtelierCustom() {
  revalidatePath("/");
  revalidatePath("/api/atelier-custom");
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { json, updatedAt } = await readSupabaseAtelierCustomJson();
    const parsed = json ? parseAtelierCustomJson(json) : null;
    const config: AdminAtelierCustomConfig = parsed
      ? { ...parsed, updatedAt: parsed.updatedAt || updatedAt }
      : SHOP_ATELIER_CUSTOM_DEFAULT;
    return jsonNoStore({
      config,
      customized: Boolean(json),
      ...adminCrmBackendFlags(),
    });
  } catch (error) {
    return respondAdminCrmReadError(error, "admin atelier-custom GET", "Impossible de charger l'atelier CUSTOM.");
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonNoStore({ error: "JSON invalide." }, { status: 400 });
  }

  const incoming = typeof body === "object" && body ? (body as Partial<AdminAtelierCustomConfig>) : {};
  const merged: AdminAtelierCustomConfig = {
    ...(SHOP_ATELIER_CUSTOM_DEFAULT as AdminAtelierCustomConfig),
    ...incoming,
    models:
      incoming.models && incoming.models.length > 0
        ? incoming.models
        : SHOP_ATELIER_CUSTOM_DEFAULT.models,
    suggestedCities:
      incoming.suggestedCities && incoming.suggestedCities.length > 0
        ? incoming.suggestedCities
        : SHOP_ATELIER_CUSTOM_DEFAULT.suggestedCities,
    updatedAt: new Date().toISOString(),
  };
  const serialized = serializeAtelierCustomConfig(merged);
  const parsed = parseAtelierCustomJson(serialized);
  if (!parsed) {
    return jsonNoStore({ error: "Configuration invalide." }, { status: 400 });
  }

  try {
    const updatedAt = await upsertSupabaseAtelierCustomJson(serialized, parsed.enabled);
    const config: AdminAtelierCustomConfig = { ...parsed, updatedAt };
    revalidateAtelierCustom();
    return jsonNoStore({ config });
  } catch (error) {
    return respondAdminCrmWriteError(
      error,
      "admin atelier-custom PATCH",
      "Impossible d'enregistrer l'atelier CUSTOM.",
    );
  }
}
