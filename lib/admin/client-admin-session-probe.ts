"use client";

import { altoCrmOrigin, isAltoHostSplitEnabled, isWebsitedxPath } from "@/lib/alto-switch-urls";

function shouldProbeAdminSessionRoute(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.trim().toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true;
  if (!isAltoHostSplitEnabled()) return true;
  const crm = altoCrmOrigin();
  if (!crm) return true;
  try {
    return new URL(crm).hostname.toLowerCase() === host;
  } catch {
    return true;
  }
}

/** Surfaces où les crayons vitrine (adminAdjust) s’appliquent. */
export function isClientAdminStorefrontAdjustPath(pathname: string): boolean {
  if (isWebsitedxPath(pathname)) return true;
  return pathname === "/checkout" || pathname.startsWith("/checkout/");
}

/**
 * Session admin côté client pour `adminAdjust` (crayons vitrine).
 * Vitrine : `/api/shop/alto-context` (cookie lu côté serveur, y compris sans probe CRM sur www).
 * CRM / local : repli `/api/admin/session`.
 */
export async function fetchClientAdminAuthenticated(pathname: string): Promise<boolean> {
  if (isClientAdminStorefrontAdjustPath(pathname)) {
    try {
      const response = await fetch("/api/shop/alto-context", { cache: "no-store", credentials: "include" });
      if (!response.ok) return false;
      const data = (await response.json()) as { authenticated?: boolean };
      return data.authenticated === true;
    } catch {
      return false;
    }
  }
  if (!shouldProbeAdminSessionRoute()) return false;
  try {
    const response = await fetch("/api/admin/session", { cache: "no-store", credentials: "include" });
    return response.ok;
  } catch {
    return false;
  }
}