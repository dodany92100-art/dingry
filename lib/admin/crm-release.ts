import { adminCrmVersion } from "@/lib/admin/crm-version";

export const ADMIN_CRM_RELEASE = {
  title: "Boutique en ligne & fiches produits",
  summary:
    "dingry.com est à jour. Le parcours client et l’édition des produits sont plus fluides ; ce bandeau résume ce qui change pour vous au quotidien.",
  highlights: [
    "Paiement : PayPal s’ouvre dans une fenêtre, le client reste sur le site pendant le règlement.",
    "Boutique : textes et prix plus lisibles (nouvelle typographie), panier et checkout harmonisés.",
    "Nouveau produit : choisir une fiche déjà en ligne dans la liste préremplit nom, prix, tailles, textes, stock et photos.",
    "Modèles catalogue : impossible d’enregistrer deux fois le même modèle par erreur.",
  ],
} as const;

export function adminCrmReleaseTitle(): string {
  return `${ADMIN_CRM_RELEASE.title} · version ${adminCrmVersion()}`;
}

export const ADMIN_CRM_RELEASE_DISMISS_KEY = "dingry-admin-crm-release-dismissed-build";
