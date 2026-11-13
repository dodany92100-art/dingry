import { ALTO_PUBLIC_FALLBACK_PATH, isAdminAppPath, normalizeAltoPublicUrl } from "@/lib/alto-last-public-url";

const RELATIVE_BASE = "https://x.invalid";

const CONTROL_OR_BACKSLASH = /[\u0000-\u001f\u007f\\]/;

function decodedPathname(pathname: string): string {
  try {
    return decodeURIComponent(pathname);
  } catch {
    try {
      return decodeURI(pathname);
    } catch {
      return pathname;
    }
  }
}

function isUnsafePathname(pathname: string): boolean {
  if (!pathname.startsWith("/") || pathname.startsWith("//")) return true;
  if (pathname.includes("\\")) return true;
  return pathname.split("/").some((segment) => segment === "..");
}

function parseInternalRelativeUrl(raw: string): URL | null {
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  if (CONTROL_OR_BACKSLASH.test(raw)) return null;
  try {
    const parsed = new URL(raw, RELATIVE_BASE);
    if (parsed.origin !== RELATIVE_BASE) return null;
    const decodedPath = decodedPathname(parsed.pathname);
    if (isUnsafePathname(parsed.pathname) || isUnsafePathname(decodedPath)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Chemin interne sûr après `/auth/callback` (évite open redirect). */
export function sanitizeAuthCallbackNext(raw: string | null | undefined): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return ALTO_PUBLIC_FALLBACK_PATH;

  const parsed = parseInternalRelativeUrl(trimmed);
  if (!parsed) return ALTO_PUBLIC_FALLBACK_PATH;

  const path = decodedPathname(parsed.pathname);
  if (isUnsafePathname(path) || isAdminAppPath(path) || path.startsWith("/auth")) {
    return ALTO_PUBLIC_FALLBACK_PATH;
  }

  const relative = `${path}${parsed.search}`;
  const normalized = normalizeAltoPublicUrl(relative);
  const normalizedPath = decodedPathname(normalized.split("?")[0] ?? "/");
  if (!normalized.startsWith("/") || normalized.includes("://")) {
    return ALTO_PUBLIC_FALLBACK_PATH;
  }
  if (isAdminAppPath(normalizedPath) || normalizedPath.startsWith("/auth")) {
    return ALTO_PUBLIC_FALLBACK_PATH;
  }
  return normalized;
}
