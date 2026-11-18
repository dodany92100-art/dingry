import { headers } from "next/headers";

import { AdminSwitcherBarScope } from "@/components/molecules/admin-switcher-bar-scope";
import { isCrmHost, isDevHost, isHostSplitActive } from "@/lib/host-routing";

/** Alto / switcher : CRM, local dev, ou split désactivé — pas sur `www` scindé. */
export async function AdminSwitcherBarLayoutGate() {
  if (!isHostSplitActive()) return <AdminSwitcherBarScope />;
  const host = (await headers()).get("host") ?? "";
  if (isDevHost(host) || isCrmHost(host)) return <AdminSwitcherBarScope />;
  return null;
}