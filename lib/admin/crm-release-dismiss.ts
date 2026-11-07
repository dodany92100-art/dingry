import { ADMIN_CRM_RELEASE_DISMISS_KEY } from "@/lib/admin/crm-release";
import { adminCrmVersion } from "@/lib/admin/crm-version";

export function crmReleaseDismissToken(): string {
  const build = (process.env.NEXT_PUBLIC_CRM_BUILD_AT ?? "dev").trim();
  return `${adminCrmVersion()}@${build}`;
}

export function isCrmReleaseDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem(ADMIN_CRM_RELEASE_DISMISS_KEY);
    return stored === crmReleaseDismissToken();
  } catch {
    return false;
  }
}

export function persistCrmReleaseDismissed(): void {
  try {
    localStorage.setItem(ADMIN_CRM_RELEASE_DISMISS_KEY, crmReleaseDismissToken());
  } catch {
    /* ignore */
  }
}
