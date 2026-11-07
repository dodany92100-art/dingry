import { adminCrmVersion } from "@/lib/admin/crm-version";

export const ADMIN_CRM_RELEASE = {
  title: "Supabase & studio produit",
  summary:
    "Catalogue et images sur Supabase Storage, fiche produit retravaillée (scroll, typo, panneaux sombres).",
  highlights: [
    "Produits en base Supabase : plus de conflits Blob sur les fiches.",
    "Upload images → bucket dgry-images (WebP compressé côté serveur).",
    "Fiche plein écran : brouillon / en ligne, zones de texte élargies.",
  ],
} as const;

export function adminCrmReleaseTitle(): string {
  return `CRM v${adminCrmVersion()} — ${ADMIN_CRM_RELEASE.title}`;
}

export const ADMIN_CRM_RELEASE_DISMISS_KEY = "dingry-admin-crm-release-dismissed-build";
