import { SHOP_PREVIEW_PATH } from "@/lib/shop-base-path";

function stripTrailingSlash(raw: string): string {
  return raw.trim().replace(/\/$/, "");
}

function originFromEnv(raw: string | undefined): string {
  const trimmed = stripTrailingSlash(raw ?? "");
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Split boutique / CRM actif côté client (origines publiques au build). */
export function isAltoHostSplitEnabled(): boolean {
  return altoShopOrigin().length > 0 && altoCrmOrigin().length > 0;
}

export function altoShopOrigin(): string {
  return originFromEnv(process.env.NEXT_PUBLIC_DINGRY_SHOP_PREVIEW_URL);
}

export function altoCrmOrigin(): string {
  return originFromEnv(process.env.NEXT_PUBLIC_DINGRY_CRM_URL);
}

export function altoShopEntryUrl(): string {
  const base = altoShopOrigin();
  if (!base) return SHOP_PREVIEW_PATH;
  return `${base}${SHOP_PREVIEW_PATH}`;
}

export function altoCrmAdminUrl(): string {
  const base = altoCrmOrigin();
  if (!base) return "/admin";
  return `${base}/admin`;
}

export function altoAbsolutePublicUrl(relativePath: string): string {
  const shop = altoShopOrigin();
  if (!shop) return relativePath;
  const trimmed = relativePath.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${shop}${path}`;
}

export function isWebsitedxPath(pathname: string): boolean {
  return pathname === SHOP_PREVIEW_PATH || pathname.startsWith(`${SHOP_PREVIEW_PATH}/`);
}