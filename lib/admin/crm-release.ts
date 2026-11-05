/** Version affichée du CRM admin (bandeau « nouveautés »). */
export const ADMIN_CRM_VERSION = "1.1";

export const ADMIN_CRM_RELEASE = {
  version: ADMIN_CRM_VERSION,
  title: "CRM v1.1 — prix unifiés",
  summary:
    "Les prix affichés en boutique et au checkout suivent désormais le stock CRM, sans couche vitrine séparée.",
  highlights: [
    "Migration automatique (magasin v6) : tarifs catalogue réalignés sur la grille seed.",
    "Checkout et devis PayPal : même montant que la fiche produit admin.",
    "Nouveau produit : prix par défaut cohérent avec les tees (35 €).",
  ],
} as const;

export const ADMIN_CRM_RELEASE_DISMISS_KEY = "dingry-admin-crm-release-dismissed";
