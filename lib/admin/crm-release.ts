/** Version affichée du CRM admin (bandeau « nouveautés »). */
export const ADMIN_CRM_VERSION = "1.2";

export const ADMIN_CRM_RELEASE = {
  version: ADMIN_CRM_VERSION,
  title: "CRM v1.2 — Supabase & studio produit",
  summary:
    "Catalogue et images sur Supabase Storage, fiche produit retravaillée (scroll, typo, panneaux sombres).",
  highlights: [
    "Produits en base Supabase : plus de conflits Blob sur les fiches.",
    "Upload images → bucket dgry-images (WebP compressé côté serveur).",
    "Fiche plein écran : brouillon / en ligne, zones de texte élargies.",
  ],
} as const;

export const ADMIN_CRM_RELEASE_DISMISS_KEY = "dingry-admin-crm-release-dismissed-build";
