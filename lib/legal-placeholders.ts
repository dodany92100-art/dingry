import {
  DINGRY_BRAND_NAME,
  DINGRY_COMPANY,
  DINGRY_CONTACT_EMAIL,
  DINGRY_CONTACT_PHONE,
  DINGRY_LEGAL_SUBTITLE,
  DINGRY_MEDIATOR,
  DINGRY_RETURNS_ADDRESS,
  DINGRY_SITE_DOMAIN,
} from "@/lib/dingry-legal";
import { PERSONALIZATION_SURCHARGE_EUR } from "@/lib/checkout-draft";

export type LegalDocId = "cgv" | "rgpd" | "mentions";

const vendorBlock = `${DINGRY_COMPANY.legalName}, ${DINGRY_COMPANY.legalForm}, au capital de ${DINGRY_COMPANY.shareCapitalEur} €, immatriculée sous le SIREN ${DINGRY_COMPANY.siren} (${DINGRY_COMPANY.rcs}), dont le siège social est situé ${DINGRY_COMPANY.registeredOffice}, exploite la marque ${DINGRY_BRAND_NAME} sur le site ${DINGRY_SITE_DOMAIN}.`;

export const LEGAL_DOCUMENTS: Record<
  LegalDocId,
  { title: string; subtitle: string; sections: Array<{ heading: string; body: string }> }
> = {
  mentions: {
    title: "Mentions légales",
    subtitle: DINGRY_LEGAL_SUBTITLE,
    sections: [
      {
        heading: "1. Éditeur du site",
        body: `${vendorBlock} Contact : ${DINGRY_CONTACT_EMAIL} — ${DINGRY_CONTACT_PHONE}.`,
      },
      {
        heading: "2. Directeur de la publication",
        body:
          "Le directeur de la publication est le Président de la société RTS MUSIC (nom et prénom à compléter sur extrait Kbis).",
      },
      {
        heading: "3. Hébergement",
        body:
          "Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (vercel.com).",
      },
      {
        heading: "4. Propriété intellectuelle",
        body:
          "L’ensemble des éléments du site (textes, visuels, logo DINGRY, mise en page) est protégé. Toute reproduction non autorisée est interdite.",
      },
      {
        heading: "5. Données personnelles",
        body: `Voir la politique de confidentialité (RGPD). Droit d’accès et de rectification : ${DINGRY_CONTACT_EMAIL}.`,
      },
    ],
  },
  cgv: {
    title: "Conditions générales de vente",
    subtitle: DINGRY_LEGAL_SUBTITLE,
    sections: [
      {
        heading: "1. Objet et vendeur",
        body: `${vendorBlock} Les présentes CGV régissent les ventes de produits ${DINGRY_BRAND_NAME} sur ${DINGRY_SITE_DOMAIN}. Toute commande implique l’acceptation des CGV en vigueur au jour de la commande.`,
      },
      {
        heading: "2. Produits, prix et éditions limitées",
        body:
          "Les articles sont des pièces de streetwear en édition limitée, présentées comme unisexes sauf mention contraire. Prix TTC en euros au moment de la validation du panier : hoodies Original 80 € ; hoodie zippé Original Black / Outline 90 € ; t-shirts Original 35 € ; sweats (crewnecks) 50 € ; casquettes 40 € ; jerseys 129 € ; autres références selon fiche produit. RTS MUSIC se réserve le droit de modifier les tarifs avant commande ; le prix facturé est celui affiché lors du paiement.",
      },
      {
        heading: "3. Commande et paiement",
        body:
          "Le paiement est exigible immédiatement via PayPal (compte PayPal ou carte bancaire par l’intermédiaire de PayPal). La commande est confirmée après acceptation du paiement par PayPal. En cas de rupture de stock constatée après paiement, remboursement sous 24 h ou proposition de réassort prioritaire, au choix du client.",
      },
      {
        heading: "4. Livraison",
        body:
          "Livraison offerte en France métropolitaine uniquement au lancement (extension internationale prévue ultérieurement). Préparation et expédition par l’équipe DINGRY depuis l’adresse logistique indiquée au client. Transporteur : Colissimo / La Poste. Délai d’expédition annoncé : 24 à 48 h ouvrées après commande. Délai de livraison indicatif : 3 à 7 jours ouvrés en France métropolitaine. Les risques sont transférés au client à réception.",
      },
      {
        heading: "5. Droit de rétractation et retours",
        body:
          "Conformément aux articles L.221-18 et suivants du Code de la consommation, le client dispose d’un délai de 14 jours à compter de la réception pour exercer son droit de rétractation. Les retours sont gratuits dans ce délai, selon la procédure communiquée par le service client. Les articles doivent être retournés non portés, non lavés, dans leur emballage d’origine. Adresse de retour : " +
          DINGRY_RETURNS_ADDRESS +
          ". Les pièces personnalisées sur commande (module Custom) ne bénéficient pas du droit de rétractation (art. L.221-28 du Code de la consommation).",
      },
      {
        heading: "6. Remboursements",
        body:
          "En cas de rétractation ou de remboursement accepté, le montant est recrédité via PayPal dans un délai maximal de 14 jours à compter de la notification de la décision, conformément à la réglementation.",
      },
      {
        heading: "7. Personnalisation (Custom)",
        body: `Le supplément de personnalisation est de ${PERSONALIZATION_SURCHARGE_EUR} € TTC par article personnalisé, en sus du prix du produit. Les visuels validés par le client lors de la commande font foi ; les créations sur mesure ne sont ni reprises ni échangées, sauf vice caché ou non-conformité.`,
      },
      {
        heading: "8. Garanties et service client",
        body:
          "Les produits bénéficient des garanties légales de conformité et des vices cachés. Pour toute réclamation : " +
          `${DINGRY_CONTACT_EMAIL}. Litiges et remboursements opérationnels sont traités via le compte PayPal Business de la marque.`,
      },
      {
        heading: "9. Médiation de la consommation",
        body: `À défaut de résolution amiable, le client peut recourir à un médiateur de la consommation. ${DINGRY_MEDIATOR}`,
      },
      {
        heading: "10. Droit applicable",
        body:
          "Les présentes CGV sont soumises au droit français. En cas de litige, les tribunaux français seront compétents, sous réserve des dispositions impératives protectrices du consommateur.",
      },
    ],
  },
  rgpd: {
    title: "Politique de confidentialité (RGPD)",
    subtitle: DINGRY_LEGAL_SUBTITLE,
    sections: [
      {
        heading: "1. Responsable du traitement",
        body: `${vendorBlock} Pour toute question relative aux données : ${DINGRY_CONTACT_EMAIL}.`,
      },
      {
        heading: "2. Données collectées",
        body:
          "Identité et coordonnées (nom, prénom, e-mail, adresse de livraison), détail des commandes, historique de contact client. Données de paiement traitées par PayPal (aucun numéro de carte stocké sur nos serveurs). Données techniques (cookies, journaux serveur). Inscription teasing / newsletter : adresse e-mail avec consentement explicite (opt-in).",
      },
      {
        heading: "3. Finalités et bases légales",
        body:
          "Exécution du contrat (commande, livraison, SAV), intérêt légitime (sécurité, lutte contre la fraude, amélioration du service), obligations légales (comptabilité), consentement pour la prospection (liste teasing, cookies non essentiels, le cas échéant Google Analytics 4 ou Meta Pixel si activés).",
      },
      {
        heading: "4. Durée de conservation",
        body:
          "Données de commande et pièces comptables : 10 ans (obligation légale). Données de prospection : jusqu’au retrait du consentement ou 3 ans à compter du dernier contact. Logs techniques : durée limitée au besoin de sécurité et de diagnostic.",
      },
      {
        heading: "5. Destinataires",
        body:
          "PayPal (paiement), Vercel (hébergement), prestataires d’e-mail et de logistique habilités, autorités compétentes sur réquisition légale. Aucune revente de données personnelles.",
      },
      {
        heading: "6. Vos droits",
        body:
          "Droit d’accès, rectification, effacement, limitation, opposition, portabilité et retrait du consentement lorsque applicable. Contact : " +
          `${DINGRY_CONTACT_EMAIL}. Réclamation auprès de la CNIL : www.cnil.fr.`,
      },
    ],
  },
};
