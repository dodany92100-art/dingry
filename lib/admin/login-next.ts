import { isPayPalOrderId } from "@/lib/paypal-order-id";

const LOGIN_NEXT_PATHS = new Set<string>(["/websitedx", "/checkout", "/checkout/cancel"]);

function hasDisallowedChars(value: string): boolean {
  return /[\x00-\x1f\x7f]/.test(value) || value.includes("\\") || value.includes("..");
}

/** Chemins internes autorisés après login (`?next=`) — liste blanche + query contrôlée. */
export function sanitizeAdminLoginNext(value: string | null | undefined): string {
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

  const question = decoded.indexOf("?");
  const path = question === -1 ? decoded : decoded.slice(0, question);
  const search = question === -1 ? "" : decoded.slice(question + 1);

  if (LOGIN_NEXT_PATHS.has(path)) {
    return search ? `${path}?${search}` : path;
  }

  if (path === "/checkout/success") {
    const token = new URLSearchParams(search).get("token")?.trim() ?? "";
    if (!isPayPalOrderId(token)) return "/admin";
    return `/checkout/success?token=${encodeURIComponent(token)}`;
  }

  return "/admin";
}
