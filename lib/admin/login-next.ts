export type AdminLoginNext = "/admin" | "/websitedx" | "/checkout";

const LOGIN_NEXT_ALLOWLIST = new Set<string>(["/websitedx", "/checkout"]);

function hasDisallowedChars(value: string): boolean {
  return /[\x00-\x1f\x7f]/.test(value) || value.includes("\\") || value.includes("..");
}

/** Chemins internes autorisés après login (`?next=`) — liste blanche exacte. */
export function sanitizeAdminLoginNext(value: string | null | undefined): AdminLoginNext {
  if (!value) return "/admin";
  let decoded = value.trim();
  try {
    if (decoded.includes("%")) decoded = decodeURIComponent(decoded);
  } catch {
    return "/admin";
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return "/admin";
  if (hasDisallowedChars(decoded)) return "/admin";
  if (/^https?:/i.test(decoded)) return "/admin";
  const path = decoded.split(/[?#]/)[0] ?? "";
  if (LOGIN_NEXT_ALLOWLIST.has(path)) return path as "/websitedx" | "/checkout";
  return "/admin";
}
