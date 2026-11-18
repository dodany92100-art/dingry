"use client";

import { usePathname } from "next/navigation";
import { AdminSwitcherBarLazy } from "@/components/molecules/admin-switcher-bar-lazy";
import { isAdminAppPath } from "@/lib/alto-last-public-url";
import { isWebsitedxPath } from "@/lib/alto-switch-urls";

function isAltoSurfacePath(pathname: string): boolean {
  return isAdminAppPath(pathname) || isWebsitedxPath(pathname);
}

/** Alto uniquement sur CRM et vitrine privée /websitedx (pas sur le teaser public). */
export function AdminSwitcherBarScope() {
  const pathname = usePathname() ?? "/";
  if (!isAltoSurfacePath(pathname)) return null;
  return <AdminSwitcherBarLazy />;
}