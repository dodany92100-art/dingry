"use client";

import { usePathname } from "next/navigation";
import { AdminSwitcherBarLazy } from "@/components/molecules/admin-switcher-bar-lazy";
import { isAdminAppPath } from "@/lib/alto-last-public-url";
import { isWebsitedxPath } from "@/lib/alto-switch-urls";

function isAltoSurfacePath(pathname: string): boolean {
  if (isAdminAppPath(pathname) || isWebsitedxPath(pathname)) return true;
  return pathname === "/checkout" || pathname.startsWith("/checkout/");
}

/** Alto sur CRM, /websitedx, checkout — pas sur le teaser public `/`. */
export function AdminSwitcherBarScope() {
  const pathname = usePathname() ?? "/";
  if (!isAltoSurfacePath(pathname)) return null;
  return <AdminSwitcherBarLazy />;
}