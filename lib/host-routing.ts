import type { NextRequest } from "next/server";

const HOST_LIST_SEP = /[,\s]+/;

export function normalizeHostname(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return "";

  if (trimmed.startsWith("[")) {
    const end = trimmed.indexOf("]");
    return end === -1 ? trimmed : trimmed.slice(1, end);
  }

  const lastColon = trimmed.lastIndexOf(":");
  if (lastColon > 0) {
    const maybePort = trimmed.slice(lastColon + 1);
    if (/^\d+$/.test(maybePort)) return trimmed.slice(0, lastColon);
  }

  return trimmed;
}

function parseHostSet(raw: string | undefined): Set<string> {
  if (!raw?.trim()) return new Set();
  const out = new Set<string>();
  for (const part of raw.split(HOST_LIST_SEP)) {
    const host = normalizeHostname(part);
    if (host) out.add(host);
  }
  return out;
}

export function crmHostFromEnv(): string | null {
  const raw = process.env.DINGRY_CRM_HOST?.trim();
  if (!raw) return null;
  return normalizeHostname(raw);
}

export function shopHostsFromEnv(): ReadonlySet<string> {
  return parseHostSet(process.env.DINGRY_SHOP_HOSTS);
}

/** Split actif uniquement si `DINGRY_CRM_HOST` est défini (non-régression). */
export function isHostSplitActive(): boolean {
  return crmHostFromEnv() !== null;
}

export function isCrmHost(host: string): boolean {
  const crm = crmHostFromEnv();
  if (!crm) return false;
  return normalizeHostname(host) === crm;
}

export function isShopHost(host: string): boolean {
  const shops = shopHostsFromEnv();
  if (shops.size === 0) return false;
  return shops.has(normalizeHostname(host));
}

/** Host de la requête — pas de `x-forwarded-host` (spoofable). */
export function requestHostname(request: NextRequest): string {
  return normalizeHostname(request.nextUrl.hostname);
}

export function isAdminSurfacePath(pathname: string): boolean {
  if (pathname === "/admin" || pathname === "/admin/") return true;
  if (pathname.startsWith("/admin/")) return true;
  if (pathname === "/api/admin") return true;
  if (pathname.startsWith("/api/admin/")) return true;
  return false;
}

/** Surface sensible : admin + upload (réservé au host CRM). */
export function isCrmOnlyPath(pathname: string): boolean {
  return isAdminSurfacePath(pathname) || pathname === "/api/upload";
}

/** Hosts de dev autorisés hors production quand le split est actif. */
export function isDevHost(host: string): boolean {
  if (process.env.NODE_ENV === "production") return false;
  const h = normalizeHostname(host);
  return h === "localhost" || h === "127.0.0.1" || h === "::1";
}

/** Toujours ouverts sur l'hôte boutique (PayPal, cron, teaser). */
export function isShopCriticalOpenPath(pathname: string): boolean {
  if (pathname === "/api/paypal/webhook") return true;
  if (pathname === "/api/teaser") return true;
  if (pathname.startsWith("/api/cron/")) return true;
  return false;
}

function isNextStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/favicon.")
  );
}

function isAccessInfrastructurePath(pathname: string): boolean {
  return pathname === "/.well-known" || pathname.startsWith("/.well-known/");
}

/** Chemins autorisés sur `DINGRY_CRM_HOST` — le reste → 404. */
export function isCrmPermittedPath(pathname: string): boolean {
  if (isNextStaticAsset(pathname)) return true;
  if (isAccessInfrastructurePath(pathname)) return true;
  if (isAdminSurfacePath(pathname)) return true;
  if (pathname === "/api/upload") return true;
  return false;
}