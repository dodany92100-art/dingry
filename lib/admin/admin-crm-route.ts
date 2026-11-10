import { isR2ImageStorageEnabled } from "@/lib/admin/blob-config";
import { StoreConflictError, StoreUnavailableError } from "@/lib/admin/store-errors";
import { jsonNoStore } from "@/lib/http";
import { isSupabaseStoreEnabled } from "@/lib/supabase/server";

export function adminCrmBackendFlags() {
  return {
    supabaseStore: isSupabaseStoreEnabled(),
    r2ImageStorage: isR2ImageStorageEnabled(),
  };
}

/** Garde homogène produits / lookbook / bannières (Supabase + R2). */
export function adminCrmMediaBackendGuard() {
  if (!isSupabaseStoreEnabled()) {
    return jsonNoStore(
      {
        error:
          "Supabase non configuré (NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).",
        ...adminCrmBackendFlags(),
      },
      { status: 503 },
    );
  }
  if (!isR2ImageStorageEnabled()) {
    return jsonNoStore(
      {
        error:
          "Stockage R2 non configuré (R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_BASE_URL).",
        ...adminCrmBackendFlags(),
      },
      { status: 503 },
    );
  }
  return null;
}

export function respondAdminCrmWriteError(error: unknown, logTag: string, fallback: string) {
  if (error instanceof StoreUnavailableError) {
    const message = error.message.trim();
    return jsonNoStore(
      { error: message || "Enregistrement indisponible.", ...adminCrmBackendFlags() },
      { status: message ? 400 : 503 },
    );
  }
  if (error instanceof StoreConflictError) {
    return jsonNoStore(
      { error: "Conflit d'enregistrement. Réessayez.", ...adminCrmBackendFlags() },
      { status: 503 },
    );
  }
  console.error(`[${logTag}]`, error instanceof Error ? error.message : error);
  const detail = error instanceof Error && error.message.trim() ? error.message.trim() : fallback;
  return jsonNoStore({ error: detail, ...adminCrmBackendFlags() }, { status: 500 });
}

export function respondAdminCrmReadError(error: unknown, logTag: string, fallback: string) {
  if (error instanceof StoreUnavailableError) {
    const message = error.message.trim();
    return jsonNoStore(
      { error: message || fallback, ...adminCrmBackendFlags() },
      { status: 503 },
    );
  }
  if (error instanceof StoreConflictError) {
    return jsonNoStore(
      { error: "Conflit d'enregistrement. Réessayez.", ...adminCrmBackendFlags() },
      { status: 503 },
    );
  }
  console.error(`[${logTag}]`, error instanceof Error ? error.message : error);
  const detail = error instanceof Error && error.message.trim() ? error.message.trim() : fallback;
  return jsonNoStore({ error: detail, ...adminCrmBackendFlags() }, { status: 500 });
}
