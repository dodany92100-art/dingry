import { adminCrmVersion } from "@/lib/admin/crm-version";
import releaseHistoryJson from "@/lib/admin/crm-release-history.json";

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
export const ADMIN_CRM_RELEASE_HISTORY: readonly AdminCrmReleaseHistoryEntry[] = releaseHistoryJson;

export const ADMIN_CRM_V1_SINCE_LABEL = ADMIN_CRM_RELEASE_HISTORY.at(-1)!.deployedAtLabel;

const current = ADMIN_CRM_RELEASE_HISTORY[0]!;

export const ADMIN_CRM_RELEASE = {
  title: current.title,
  summary:
    "dingry.com est à jour. Le parcours client et l’édition des produits sont plus fluides ; ce bandeau résume ce qui change pour vous au quotidien.",
  highlights: current.highlights,
} as const;

export function adminCrmReleaseTitle(): string {
  return `${ADMIN_CRM_RELEASE.title} · version ${adminCrmVersion()}`;
}

export function adminCrmReleaseVersionLabel(entry: AdminCrmReleaseHistoryEntry): string {
  const hint = entry.versionHint?.trim();
  if (hint && /^\d+\.\d+$/.test(hint)) return `v. ${hint}`;
  if (hint && /^\d+$/.test(hint)) return `v. 1.2.${hint}`;
  if (hint) return `v. ${hint}`;
  return `v. ${adminCrmVersion()}`;
}

export const ADMIN_CRM_RELEASE_DISMISS_KEY = "dingry-admin-crm-release-dismissed-build";