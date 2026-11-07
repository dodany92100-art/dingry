/** Ligne de version majeure / mineure (contenu du bandeau). Incrémenter manuellement si besoin. */
export const ADMIN_CRM_VERSION_BASE = "1.2";

/** Version affichée : `1.2.<build>` (build = nb commits ou override CI). */
export function adminCrmVersion(): string {
  const patch = (process.env.NEXT_PUBLIC_CRM_VERSION_PATCH ?? "").trim();
  if (!patch) return ADMIN_CRM_VERSION_BASE;
  return `${ADMIN_CRM_VERSION_BASE}.${patch}`;
}
