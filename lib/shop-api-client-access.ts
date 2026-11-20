import { ADMIN_COOKIE_NAME } from "@/lib/admin/session-token";
import { altoCrmOrigin, isAltoHostSplitEnabled } from "@/lib/alto-switch-urls";
import { PREVIEW_COOKIE_NAME } from "@/lib/preview-cookie";

function hostFromWindow(): string {
  if (typeof window === "undefined") return "";
  return window.location.hostname.trim().toLowerCase();
}

function isLocalDevHost(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

/** Gate teaser côté client (miroir de `isTeaserGateActive` via env build). */
export function isTeaserGateActiveClient(): boolean {
  const raw = process.env.NEXT_PUBLIC_DINGRY_TEASER_GATE?.trim().toLowerCase() ?? "";
  if (!raw) return true;
  if (raw === "off" || raw === "0" || raw === "false" || raw === "disabled") return false;
  return true;
}

function hasClientPreviewOrAdminCookie(): boolean {
  if (typeof document === "undefined") return false;
  const cookies = document.cookie;
  return (
    cookies.includes(`${PREVIEW_COOKIE_NAME}=`) || cookies.includes(`${ADMIN_COOKIE_NAME}=`)
  );
}

/** `/api/admin/session` uniquement CRM, local, ou split désactivé. */
export function shouldClientProbeAdminSession(): boolean {
  const host = hostFromWindow();
  if (!host) return false;
  if (isLocalDevHost(host)) return true;
  if (!isAltoHostSplitEnabled()) return true;
  const crm = altoCrmOrigin();
  if (!crm) return true;
  try {
    return new URL(crm).hostname.toLowerCase() === host;
  } catch {
    return true;
  }
}

function isShopGatedSurfacePath(pathname: string): boolean {
  if (pathname === "/websitedx" || pathname.startsWith("/websitedx/")) return true;
  if (pathname === "/checkout" || pathname.startsWith("/checkout/")) return true;
  return false;
}

/**
 * Catalogue live CRM : les cookies admin/preview sont httpOnly (invisibles en JS).
 * Sur vitrine/checkout, le proxy a déjà validé la session → on appelle `/api/catalog`.
 */
export function shouldClientFetchGatedShopApi(): boolean {
  if (!isTeaserGateActiveClient()) return true;
  const host = hostFromWindow();
  if (isLocalDevHost(host)) return true;
  if (typeof window !== "undefined" && isShopGatedSurfacePath(window.location.pathname)) {
    return true;
  }
  return hasClientPreviewOrAdminCookie();
}