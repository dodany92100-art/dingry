import { ADMIN_CRM_VERSION_BASE, adminCrmVersion } from "@/lib/admin/crm-version";
import releaseHistoryJson from "@/lib/admin/crm-release-history.json";
import { sortCrmReleaseHistoryNewestFirst } from "@/lib/admin/crm-release-sort";

export type AdminCrmReleaseHistoryEntry = {
  id: string;
  /** Affichage (ex. « 14 nov. 2026 »). */
  deployedAtLabel: string;
  /** Suffixe version (ex. « 210 ») ou libellé complet si besoin. */
  versionHint?: string;
  title: string;
  highlights: readonly string[];
};

/** Du plus récent au plus ancien — éditer via `npm run changelog:add` (voir scripts/crm-changelog.mjs). */
export const ADMIN_CRM_RELEASE_HISTORY: readonly AdminCrmReleaseHistoryEntry[] =
  sortCrmReleaseHistoryNewestFirst(releaseHistoryJson);

export const ADMIN_CRM_V1_SINCE_LABEL = ADMIN_CRM_RELEASE_HISTORY.at(-1)!.deployedAtLabel;

const current = ADMIN_CRM_RELEASE_HISTORY[0]!;

export const ADMIN_CRM_RELEASE = {
  title: current.title,
  summary:
    "dingry.com est à jour. Le parcours client et l’édition des produits sont plus fluides ; ce bandeau résume ce qui change pour vous au quotidien.",
  highlights: current.highlights,
} as const;

/** Version affichée alignée sur la release courante du journal (sinon build git / CI). */
export function adminCrmDisplayVersion(): string {
  const hint = ADMIN_CRM_RELEASE_HISTORY[0]?.versionHint?.trim();
  if (hint && /^\d+$/.test(hint)) return `${ADMIN_CRM_VERSION_BASE}.${hint}`;
  if (hint && /^\d+\.\d+(\.\d+)?$/.test(hint)) return hint;
  if (hint) return hint;
  return adminCrmVersion();
}

export function adminCrmReleaseTitle(): string {
  return `${ADMIN_CRM_RELEASE.title} · version ${adminCrmDisplayVersion()}`;
}

export function adminCrmReleaseVersionLabel(entry: AdminCrmReleaseHistoryEntry): string {
  const hint = entry.versionHint?.trim();
  if (!hint) return "";
  if (/^\d+\.\d+$/.test(hint)) return `v. ${hint}`;
  if (/^\d+$/.test(hint)) return `v. ${ADMIN_CRM_VERSION_BASE}.${hint}`;
  return `v. ${hint}`;
}

export const ADMIN_CRM_RELEASE_DISMISS_KEY = "dingry-admin-crm-release-dismissed-build";