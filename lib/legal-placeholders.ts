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
        heading: "5. Politique de retours — Notre politique",
        body:
          "Chez DINGRY, nous souhaitons que chaque client soit satisfait de sa commande. Si un article ne vous convient pas, vous pouvez demander son retour dans les conditions décrites ci-dessous.",
      },
      {
        heading: "6. Droit de rétractation — 14 jours",
        body:
          "Conformément à la législation française, vous disposez d'un délai de 14 jours calendaires à compter de la réception de votre commande pour exercer votre droit de rétractation, sans avoir à fournir de justification. Ce droit s'applique également aux articles soldés et aux collections en édition limitée. Pour effectuer une demande, contactez-nous à : dingry@gmail.com. Indiquez votre numéro de commande et les articles concernés.",
      },
      {
        heading: "7. Conditions de retour",
        body:
          "Les articles doivent être retournés dans un état permettant leur remise en vente. Ils ne doivent pas avoir été portés, lavés ou détériorés au-delà des manipulations nécessaires pour les essayer. Les étiquettes et emballages d'origine doivent être conservés dans la mesure du possible. En cas de manipulation excessive ayant entraîné une dépréciation du produit, DINGRY pourra appliquer les règles légales correspondantes. Adresse de retour (logistique) : " +
          DINGRY_RETURNS_ADDRESS +
          ".",
      },
      {
        heading: "8. Frais de retour",
        body:
          "Sauf indication contraire, les frais de retour liés à l'exercice du droit de rétractation sont à la charge du client, à condition que cette information lui ait été communiquée avant l'achat. En cas d'article défectueux, non conforme ou d'erreur de préparation imputable à DINGRY, les frais de retour sont pris en charge par DINGRY.",
      },
      {
        heading: "9. Remboursements",
        body:
          "Après validation du retour, le remboursement est effectué dans un délai maximum de 14 jours, conformément aux dispositions légales. DINGRY peut toutefois différer le remboursement jusqu'à la récupération des articles ou jusqu'à réception d'une preuve de leur expédition, selon la première de ces éventualités. Le remboursement est effectué via le moyen de paiement utilisé lors de la commande (notamment PayPal), sauf accord contraire du client. Les frais de livraison initiaux standard sont également remboursés en cas de rétractation totale.",
      },
      {
        heading: "10. Articles défectueux ou erreurs de commande",
        body:
          "Si vous recevez un article défectueux, endommagé ou différent de celui commandé, contactez-nous rapidement à dingry@gmail.com en précisant votre numéro de commande et en joignant, si possible, des photographies. DINGRY étudiera votre demande et proposera une solution adaptée : remplacement, remboursement ou autre solution prévue par les garanties légales applicables. Les frais de retour seront pris en charge par DINGRY lorsque le problème lui est imputable.",
      },
      {
        heading: "11. Articles non retournables",
        body:
          "Les articles personnalisés ou confectionnés selon les spécifications particulières du client peuvent être exclus du droit de rétractation dans les conditions prévues par la loi. Les éditions limitées, les articles soldés et les collections spéciales restent soumis aux droits légaux de rétractation et de garantie.",
      },
      {
        heading: "12. Contact — retours et remboursements",
        body:
          "Pour toute question concernant un retour ou un remboursement : E-mail dingry@gmail.com · Site " +
          DINGRY_SITE_DOMAIN +
          ". Nous nous engageons à traiter chaque demande dans les meilleurs délais. DINGRY — Des pièces, pas des compromis.",
      },
      {
        heading: "13. Personnalisation (Custom)",
        body: `Le supplément de personnalisation est de ${PERSONALIZATION_SURCHARGE_EUR} € TTC par article personnalisé, en sus du prix du produit. Les visuels validés par le client lors de la commande font foi ; les créations sur mesure ne sont ni reprises ni échangées, sauf vice caché ou non-conformité.`,
      },
      {
        heading: "14. Garanties et service client",
        body:
          "Les produits bénéficient des garanties légales de conformité et des vices cachés. Pour toute réclamation : " +
          `${DINGRY_CONTACT_EMAIL}. Litiges et remboursements opérationnels sont traités via le compte PayPal Business de la marque.`,
      },
      {
        heading: "15. Médiation de la consommation",
        body: `À défaut de résolution amiable, le client peut recourir à un médiateur de la consommation. ${DINGRY_MEDIATOR}`,
      },
      {
        heading: "16. Droit applicable",
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
