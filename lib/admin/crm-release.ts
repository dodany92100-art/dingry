import { adminCrmVersion } from "@/lib/admin/crm-version";

export type AdminCrmReleaseHistoryEntry = {
  id: string;
  /** Affichage (ex. « 14 nov. 2026 »). */
  deployedAtLabel: string;
  /** Suffixe version (ex. « 210 ») ou libellé complet si besoin. */
  versionHint?: string;
  title: string;
  highlights: readonly string[];
};

/** Du plus récent au plus ancien — ajouter une entrée à chaque déploiement notable. */
export const ADMIN_CRM_RELEASE_HISTORY: readonly AdminCrmReleaseHistoryEntry[] = [
  {
    id: "2026-11-14-boutique-crm",
    deployedAtLabel: "14 nov. 2026",
    versionHint: "210",
    title: "Boutique en ligne & fiches produits",
    highlights: [
      "Paiement : PayPal s’ouvre dans une fenêtre, le client reste sur le site pendant le règlement.",
      "Boutique : textes et prix plus lisibles (nouvelle typographie), panier et checkout harmonisés.",
      "Nouveau produit : choisir une fiche déjà en ligne dans la liste préremplit nom, prix, tailles, textes, stock et photos.",
      "Modèles catalogue : impossible d’enregistrer deux fois le même modèle par erreur.",
      "Commandes CRM : e-mail et téléphone cliquables, bouton « Étiquette envoi » pour imprimer l’adresse.",
      "Onglet Codes promo : génération et copie rapide (à brancher sur le checkout ensuite).",
    ],
  },
  {
    id: "2026-11-14-vitrine",
    deployedAtLabel: "14 nov. 2026",
    title: "Vitrine DINGRY",
    highlights: [
      "Footer resserré, newsletter avec envoi par flèche or.",
      "Navigation : Atelier Custom avant Lookbook, CTA catalogue avec effet aimanté sur la barre.",
      "Bande bas de page gold foil (heritage · lookbook · footer).",
    ],
  },
  {
    id: "2026-11-14-prod",
    deployedAtLabel: "14 nov. 2026",
    title: "Alignement dingry.com",
    highlights: [
      "Checkout PayPal aligné sur la production.",
      "Parcours vitrine stabilisé pour la mise en ligne.",
    ],
  },
  {
    id: "2026-11-13-checkout-compte",
    deployedAtLabel: "13 nov. 2026",
    title: "Checkout invité & compte client",
    highlights: [
      "Achat invité avec rattachement commande au compte.",
      "Tunnel expédition et statuts commande renforcés.",
      "Panneau Mon compte et déconnexion côté boutique.",
    ],
  },
  {
    id: "2026-11-13-auth",
    deployedAtLabel: "13 nov. 2026",
    title: "Connexion Google",
    highlights: [
      "OAuth Google via Supabase (boutique).",
      "Callback et session navigateur durcis (PKCE).",
    ],
  },
  {
    id: "2026-11-06-crm-modulaire",
    deployedAtLabel: "6 nov. 2026",
    versionHint: "1.1",
    title: "CRM modulaire & lookbook",
    highlights: [
      "Refactor admin (onglets, stock, commandes, lookbook).",
      "Résolution des motifs « à vérifier » depuis l’UI commandes.",
      "Store Blob sécurisé (plus d’écrasement accidentel des commandes).",
      "Pipeline anti-régression (tests vitrine + checkout).",
    ],
  },
  {
    id: "2026-11-05-crm-v1-1",
    deployedAtLabel: "5 nov. 2026",
    title: "CRM v1.1 — prix & couleurs",
    highlights: [
      "Prix unifiés boutique ↔ fiches CRM.",
      "Bandeau nouveautés admin.",
      "Couleurs variante pour chaque catégorie stock.",
      "Heritage, footer et voix de marque DINGRY.",
    ],
  },
  {
    id: "2026-11-04-admin",
    deployedAtLabel: "4 nov. 2026",
    title: "Admin — navigation stock",
    highlights: ["Scroll et filtres catégories corrigés.", "Édition catalogue plus stable en preview."],
  },
  {
    id: "2026-10-30-paypal-preview",
    deployedAtLabel: "30 oct. 2026",
    title: "PayPal & preview boutique",
    highlights: [
      "PayPal côté serveur, remplace Stripe.",
      "Admin centré sur stock + commandes.",
      "Preview Vercel, cron et scripts déploiement.",
      "Panier, prix verso/recto, total serveur.",
    ],
  },
  {
    id: "crm-v1-launch",
    deployedAtLabel: "28 oct. 2026",
    versionHint: "1.0",
    title: "CRM v1 — lancement",
    highlights: [
      "Premier back-office DINGRY : stock et commandes.",
      "Upload photos WebP (moins de 1 Mo), fiches recto/verso.",
      "Catalogue mobile : filtres, cartes compactes, menu sticky.",
      "Fiche produit au format naturel + moyens de paiement au footer.",
    ],
  },
] as const;

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