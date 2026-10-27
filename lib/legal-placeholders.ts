export type LegalDocId = "cgv" | "rgpd";

export const LEGAL_DOCUMENTS: Record<
  LegalDocId,
  { title: string; subtitle: string; sections: Array<{ heading: string; body: string }> }
> = {
  cgv: {
    title: "Conditions générales de vente",
    subtitle: "Document provisoire — à valider par un conseil juridique avant mise en production.",
    sections: [
      {
        heading: "1. Objet",
        body:
          "Les présentes conditions générales de vente (CGV) régissent les ventes de produits DINGRY sur le site dingry.fr. Toute commande implique l’acceptation sans réserve des CGV en vigueur au jour de la commande.",
      },
      {
        heading: "2. Produits et prix",
        body:
          "Les produits proposés sont des articles de streetwear en édition limitée. Les prix sont indiqués en euros TTC. DINGRY se réserve le droit de modifier ses tarifs ; le prix facturé est celui affiché au moment de la validation du panier.",
      },
      {
        heading: "3. Commande et paiement",
        body:
          "Le paiement est exigible immédiatement à la commande par carte bancaire, PayPal ou Apple Pay via Stripe. La commande est confirmée après acceptation du paiement par l’établissement bancaire.",
      },
      {
        heading: "4. Livraison",
        body:
          "Les délais de livraison sont communiqués à titre indicatif (ex. 3 à 7 jours ouvrés en France métropolitaine). Les risques liés au transport sont supportés par le client à réception des produits.",
      },
      {
        heading: "5. Droit de rétractation",
        body:
          "Conformément au Code de la consommation, le client dispose d’un délai de 14 jours à compter de la réception pour exercer son droit de rétractation, sous réserve que les articles soient retournés dans leur état d’origine.",
      },
      {
        heading: "6. Contact",
        body:
          "Pour toute question relative à une commande : contact@dingry.fr — DINGRY, 12 rue du Temple, 75004 Paris (adresse fictive en attente de siège définitif).",
      },
    ],
  },
  rgpd: {
    title: "Politique de confidentialité (RGPD)",
    subtitle: "Document provisoire — à compléter avec le DPO ou un avocat avant production.",
    sections: [
      {
        heading: "1. Responsable du traitement",
        body:
          "DINGRY (SAS en cours d’immatriculation — données fictives), 12 rue du Temple, 75004 Paris, contact@dingry.fr, est responsable du traitement des données personnelles collectées sur ce site.",
      },
      {
        heading: "2. Données collectées",
        body:
          "Nous pouvons collecter : identité, coordonnées (e-mail, adresse de livraison), données de commande et de paiement (traitées par Stripe, sans conservation des numéros de carte sur nos serveurs), ainsi que des données techniques (cookies, logs) pour le fonctionnement du site.",
      },
      {
        heading: "3. Finalités",
        body:
          "Gestion des commandes, livraison, service client, lutte contre la fraude, statistiques de fréquentation et respect des obligations légales.",
      },
      {
        heading: "4. Base légale",
        body:
          "Exécution du contrat (commande), intérêt légitime (sécurité, amélioration du service) et consentement lorsque requis (newsletter, cookies non essentiels).",
      },
      {
        heading: "5. Durée de conservation",
        body:
          "Les données de commande sont conservées pendant la durée nécessaire à la gestion de la relation commerciale et aux obligations comptables (généralement 10 ans pour les pièces comptables).",
      },
      {
        heading: "6. Vos droits",
        body:
          "Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité. Pour exercer vos droits : contact@dingry.fr. Réclamation possible auprès de la CNIL (www.cnil.fr).",
      },
    ],
  },
};
