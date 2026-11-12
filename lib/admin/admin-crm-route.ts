import { allowCatalogSeedFallback, isR2ImageStorageEnabled } from "@/lib/admin/blob-config";
import { StoreConflictError, StoreUnavailableError } from "@/lib/admin/store-errors";
import { jsonNoStore } from "@/lib/http";
import { isSupabaseStoreEnabled, supabaseUrl } from "@/lib/supabase/server";

export function adminCrmBackendFlags() {
  return {
    supabaseStore: isSupabaseStoreEnabled(),
    r2ImageStorage: isR2ImageStorageEnabled(),
  };
}

function supabaseCrmConfigError(): string {
  const url = supabaseUrl();
  const serviceRole = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url && !serviceRole) {
    return "Supabase non configuré : définir NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY (.env.local ou Vercel).";
  }
  if (!url) {
    return "NEXT_PUBLIC_SUPABASE_URL manquant.";
  }
  if (!serviceRole) {
    return "SUPABASE_SERVICE_ROLE_KEY est vide — Supabase → Project Settings → API → service_role (secret), puis Vercel Development/Preview/Production.";
  }
  return "Supabase CRM indisponible.";
}

function adminCrmSupabaseGuard() {
  if (!isSupabaseStoreEnabled()) {
    return jsonNoStore(
      {
        error: supabaseCrmConfigError(),
        ...adminCrmBackendFlags(),
      },
      { status: 503 },
    );
  }
  return null;
}

/** Lecture lookbook / bannières — prod : Supabase ; dev/preview : seed si Supabase incomplet. */
export function adminCrmMediaReadGuard() {
  if (isSupabaseStoreEnabled()) return null;
  if (allowCatalogSeedFallback()) return null;
  return adminCrmSupabaseGuard();
}

/** Écriture + upload média CRM (Supabase + R2). */
export function adminCrmMediaBackendGuard() {
  const blocked = adminCrmSupabaseGuard();
  if (blocked) return blocked;
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
