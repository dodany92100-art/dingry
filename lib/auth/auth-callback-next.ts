import { ALTO_PUBLIC_FALLBACK_PATH, isAdminAppPath, normalizeAltoPublicUrl } from "@/lib/alto-last-public-url";

/** Chemin interne sûr après `/auth/callback` (évite open redirect). */
export function sanitizeAuthCallbackNext(raw: string | null | undefined): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return ALTO_PUBLIC_FALLBACK_PATH;
  }
  const path = trimmed.split("?")[0] ?? "/";
  if (isAdminAppPath(path) || path.startsWith("/auth")) {
    return ALTO_PUBLIC_FALLBACK_PATH;
  }
  return normalizeAltoPublicUrl(trimmed);
}
