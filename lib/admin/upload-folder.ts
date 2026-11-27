const ALLOWED_PREFIXES = [
  "dingry/products/",
  "dingry/lookbook/",
  "dingry/banner/",
  "dingry/vitrine/",
  "dingry/atelier/",
] as const;

/** Dossier R2 autorisé pour `/api/upload` (pas de `..`, préfixe whitelist). */
export function sanitizeAdminUploadFolder(raw: string): string | null {
  const trimmed = raw.trim().replace(/^\/+|\/+$/g, "");
  if (!trimmed) return null;
  if (trimmed.includes("..") || /[\0\\]/.test(trimmed)) return null;
  const normalized = trimmed
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .join("/");
  if (!normalized) return null;
  const allowed = ALLOWED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
  if (!allowed) return null;
  return normalized;
}