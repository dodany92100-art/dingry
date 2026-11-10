import {
  DINGRY_BRAND_NAME,
  DINGRY_COMPANY,
  DINGRY_CONTACT_EMAIL,
  DINGRY_CONTACT_PHONE,
  DINGRY_LEGAL_SUBTITLE,
  DINGRY_SITE_DOMAIN,
} from "@/lib/dingry-legal";
export type LegalDocId = "cgv" | "rgpd" | "mentions" | "retours" | "livraison";

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
    title: "Conditions générales de vente (CGV)",
    subtitle: "DINGRY — dingry.fr · Dernière mise à jour : 06/11/2026",
    sections: [
      {
        heading: "1. Objet",
        body:
          "Les présentes Conditions Générales de Vente (CGV) régissent les ventes de vêtements et accessoires proposés par DINGRY sur le site dingry.fr. Toute commande passée sur le site implique l'acceptation pleine et entière des présentes CGV par le client.",
      },
      {
        heading: "2. Produits et prix",
        body:
          "DINGRY propose des articles de streetwear, notamment en séries limitées. Les produits sont présentés avec leurs caractéristiques essentielles et leurs visuels. De légères différences de couleurs peuvent exister selon les écrans. Les prix sont indiqués en euros, toutes taxes comprises (TTC), hors frais de livraison éventuels, précisés avant validation de la commande. DINGRY se réserve le droit de modifier ses prix à tout moment. Le prix appliqué est celui affiché au moment de la commande.",
      },
      {
        heading: "3. Commande et paiement",
        body:
          "Les commandes sont effectuées directement sur le site dingry.fr. Le paiement est exigible immédiatement et s'effectue via PayPal, avec un compte PayPal ou par carte bancaire lorsque cette option est proposée par PayPal. La commande est considérée comme définitive après validation du paiement et réception d'un e-mail de confirmation. En raison du caractère parfois limité des collections, les stocks disponibles peuvent être restreints. Une commande ne peut être confirmée au-delà des quantités réellement disponibles.",
      },
      {
        heading: "4. Livraison",
        body: `Les commandes sont expédiées à l'adresse renseignée par le client lors de son achat. Les délais de livraison annoncés sont généralement de 3 à 7 jours ouvrés en France métropolitaine, sauf indication contraire au moment de la commande. Les frais de livraison sont à la charge du client, déterminés selon la destination et le transporteur choisi, et sont indiqués avant la validation définitive de la commande (voir la Politique tarifaire — frais de livraison sur le site). En cas de retard, de perte ou de détérioration du colis, le client est invité à contacter DINGRY à l'adresse : ${DINGRY_CONTACT_EMAIL}. La responsabilité des risques liés au transport est transférée au client uniquement au moment où celui-ci, ou un tiers désigné par lui, prend physiquement possession du colis.`,
      },
      {
        heading: "5. Droit de rétractation et retours",
        body: `Conformément au Code de la consommation, le client dispose d'un délai légal de 14 jours à compter de la réception de sa commande pour exercer son droit de rétractation, sans avoir à justifier sa décision. Pour exercer ce droit, le client doit informer DINGRY par e-mail à : ${DINGRY_CONTACT_EMAIL} ou utiliser la fonctionnalité de rétractation disponible sur le site. Les articles doivent être retournés dans un état permettant leur remise en vente, sans avoir été portés ni lavés, au-delà des manipulations nécessaires pour les essayer. Les frais de retour sont à la charge du client, sauf en cas d'article défectueux ou d'erreur imputable à DINGRY. Le remboursement sera effectué dans les délais légaux, via le moyen de paiement initial. Les articles soldés ou issus de collections limitées restent soumis au droit légal de rétractation.`,
      },
      {
        heading: "6. Garanties légales",
        body:
          "Tous les produits vendus par DINGRY bénéficient des garanties légales applicables, notamment : la garantie légale de conformité, prévue aux articles L.217-3 et suivants du Code de la consommation ; la garantie contre les vices cachés, prévue aux articles 1641 et suivants du Code civil. Ces garanties s'appliquent indépendamment de toute garantie commerciale éventuelle.",
      },
      {
        heading: "7. Responsabilité",
        body:
          "DINGRY ne saurait être tenue responsable d'une mauvaise utilisation ou d'un entretien inadapté des produits par le client. Cette disposition ne limite en aucun cas les droits légaux du consommateur.",
      },
      {
        heading: "8. Service client et litiges",
        body: `Pour toute question, réclamation ou demande concernant une commande, le client peut contacter DINGRY : ${DINGRY_CONTACT_EMAIL}. En cas de désaccord, le client est invité à contacter DINGRY afin de rechercher une solution amiable. À défaut de résolution amiable, le client peut recourir gratuitement au médiateur de la consommation dont relève DINGRY, dont les coordonnées seront communiquées sur le site. Les présentes CGV sont soumises au droit français. Les dispositions légales protectrices du consommateur restent applicables. DINGRY — Des pièces, pas des compromis.`,
      },
    ],
  },
  rgpd: {
    title: "Politique de confidentialité",
    subtitle: "DINGRY — dingry.fr · Dernière mise à jour : 06/11/2026",
    sections: [
      {
        heading: "1. Introduction",
        body:
          "DINGRY accorde une importance particulière à la protection des données personnelles de ses clients et visiteurs. La présente politique explique quelles données sont collectées sur dingry.fr, pourquoi elles sont utilisées et quels sont vos droits conformément au Règlement Général sur la Protection des Données (RGPD).",
      },
      {
        heading: "2. Données collectées",
        body:
          "Lors de votre navigation ou d'une commande sur notre site, nous pouvons collecter les informations suivantes : nom et prénom ; adresse postale et adresse e-mail ; informations nécessaires au traitement et à la livraison des commandes ; historique des commandes et échanges avec notre service client ; données techniques de navigation, notamment via les cookies. Les informations bancaires ne sont pas directement conservées par DINGRY lorsque le paiement est traité par PayPal.",
      },
      {
        heading: "3. Utilisation des données",
        body:
          "Les données collectées sont utilisées uniquement pour : traiter et expédier les commandes ; gérer les paiements et les éventuels remboursements ; répondre aux demandes des clients ; assurer le suivi et l'amélioration de notre site ; envoyer des communications commerciales, uniquement lorsque les conditions légales sont réunies.",
      },
      {
        heading: "4. Partage des données",
        body:
          "Les données personnelles ne sont ni vendues ni louées à des tiers. Elles peuvent être transmises uniquement aux prestataires nécessaires au fonctionnement de notre activité, notamment : PayPal, pour le traitement des paiements ; les transporteurs, pour la livraison des commandes ; nos prestataires techniques et d'hébergement, pour le fonctionnement du site. Ces prestataires n'ont accès qu'aux informations nécessaires à leurs missions.",
      },
      {
        heading: "5. Conservation des données",
        body:
          "Les données personnelles sont conservées pendant une durée limitée, adaptée à leur utilisation et aux obligations légales applicables. Les données liées aux commandes et à la facturation peuvent notamment être conservées pendant les durées légales d'archivage. Les données utilisées à des fins commerciales sont conservées conformément aux durées prévues par la réglementation.",
      },
      {
        heading: "6. Cookies",
        body:
          "Le site dingry.fr peut utiliser des cookies nécessaires à son fonctionnement ainsi que, sous réserve du consentement du visiteur, des cookies destinés à mesurer l'audience ou à améliorer l'expérience de navigation. Chaque visiteur peut accepter, refuser ou personnaliser les cookies non essentiels via le bandeau de gestion des cookies du site.",
      },
      {
        heading: "7. Vos droits",
        body: `Conformément au RGPD, chaque utilisateur dispose notamment des droits suivants : droit d'accès à ses données ; droit de rectification ; droit à l'effacement, dans les limites légales ; droit d'opposition ; droit à la limitation du traitement ; droit à la portabilité lorsque celui-ci est applicable. Pour exercer vos droits, vous pouvez contacter DINGRY à l'adresse suivante : ${DINGRY_CONTACT_EMAIL}. Vous pouvez également adresser une réclamation à la CNIL : www.cnil.fr.`,
      },
      {
        heading: "8. Sécurité",
        body:
          "DINGRY met en œuvre des mesures techniques et organisationnelles adaptées afin de protéger les données personnelles contre les accès non autorisés, la perte ou la divulgation.",
      },
      {
        heading: "9. Modification de la politique",
        body:
          "DINGRY se réserve le droit de modifier la présente politique afin de tenir compte des évolutions légales ou techniques. La version actualisée sera publiée sur dingry.fr. DINGRY — dingry.fr. Des pièces, pas des compromis.",
      },
    ],
  },
  retours: {
    title: "Politique de retours et remboursements",
    subtitle: "DINGRY — dingry.fr · Dernière mise à jour : 06/11/2026",
    sections: [
      {
        heading: "1. Notre politique",
        body:
          "Chez DINGRY, nous souhaitons que chaque client soit satisfait de sa commande. Si un article ne vous convient pas, vous pouvez demander son retour dans les conditions décrites ci-dessous.",
      },
      {
        heading: "2. Droit de rétractation — 14 jours",
        body: `Conformément à la législation française, vous disposez d'un délai de 14 jours calendaires à compter de la réception de votre commande pour exercer votre droit de rétractation, sans avoir à fournir de justification. Ce droit s'applique également aux articles soldés et aux collections en édition limitée. Pour effectuer une demande, contactez-nous à : ${DINGRY_CONTACT_EMAIL}. Indiquez votre numéro de commande et les articles concernés.`,
      },
      {
        heading: "3. Conditions de retour",
        body:
          "Les articles doivent être retournés dans un état permettant leur remise en vente. Ils ne doivent pas avoir été portés, lavés ou détériorés au-delà des manipulations nécessaires pour les essayer. Les étiquettes et emballages d'origine doivent être conservés dans la mesure du possible. En cas de manipulation excessive ayant entraîné une dépréciation du produit, DINGRY pourra appliquer les règles légales correspondantes.",
      },
      {
        heading: "4. Frais de retour",
        body:
          "Sauf indication contraire, les frais de retour liés à l'exercice du droit de rétractation sont à la charge du client, à condition que cette information lui ait été communiquée avant l'achat. En cas d'article défectueux, non conforme ou d'erreur de préparation imputable à DINGRY, les frais de retour sont pris en charge par DINGRY.",
      },
      {
        heading: "5. Remboursements",
        body:
          "Après validation du retour, le remboursement est effectué dans un délai maximum de 14 jours, conformément aux dispositions légales. DINGRY peut toutefois différer le remboursement jusqu'à la récupération des articles ou jusqu'à réception d'une preuve de leur expédition, selon la première de ces éventualités. Le remboursement est effectué via le moyen de paiement utilisé lors de la commande, sauf accord contraire du client. Les frais de livraison initiaux standard sont également remboursés en cas de rétractation totale.",
      },
      {
        heading: "6. Articles défectueux ou erreurs de commande",
        body: `Si vous recevez un article défectueux, endommagé ou différent de celui commandé, contactez-nous rapidement à ${DINGRY_CONTACT_EMAIL} en précisant votre numéro de commande et en joignant, si possible, des photographies. DINGRY étudiera votre demande et proposera une solution adaptée : remplacement, remboursement ou autre solution prévue par les garanties légales applicables. Les frais de retour seront pris en charge par DINGRY lorsque le problème lui est imputable.`,
      },
      {
        heading: "7. Articles non retournables",
        body:
          "Les articles personnalisés ou confectionnés selon les spécifications particulières du client peuvent être exclus du droit de rétractation dans les conditions prévues par la loi. Les éditions limitées, les articles soldés et les collections spéciales restent soumis aux droits légaux de rétractation et de garantie.",
      },
      {
        heading: "8. Contact",
        body: `Pour toute question concernant un retour ou un remboursement, notre service client est disponible à l'adresse suivante : e-mail ${DINGRY_CONTACT_EMAIL} · site ${DINGRY_SITE_DOMAIN}. Nous nous engageons à traiter chaque demande dans les meilleurs délais. DINGRY — ${DINGRY_SITE_DOMAIN}. Des pièces, pas des compromis.`,
      },
    ],
  },
  livraison: {
    title: "Politique tarifaire — frais de livraison",
    subtitle: "DINGRY Paris — dingry.fr · Dernière mise à jour : 10 novembre 2026",
    sections: [
      {
        heading: "1. Principes généraux",
        body:
          "DINGRY propose différents modes de livraison afin de permettre à ses clients de choisir la solution la plus adaptée à leurs besoins, en fonction de leur destination, du prix et des modalités de transport disponibles. Les frais de livraison sont à la charge du client et s'ajoutent au prix des articles commandés. Aucune livraison n'est systématiquement offerte par DINGRY, sauf mention contraire dans le cadre d'une offre commerciale ponctuelle.",
      },
      {
        heading: "2. Modes de livraison et choix du transporteur",
        body:
          "Lors du passage de sa commande, le client peut consulter les différentes solutions de livraison proposées pour sa destination. Lorsque plusieurs transporteurs ou modes de livraison sont disponibles, les options sont présentées afin de permettre au client de comparer les frais correspondants et de sélectionner la solution de son choix. Les solutions proposées peuvent notamment concerner : la livraison à domicile ; la livraison en point relais ou en point de retrait. Les transporteurs susceptibles d'être proposés dépendent des destinations desservies et des services effectivement disponibles au moment de la commande. La présence d'un transporteur ou d'un mode de livraison sur le site ne constitue pas une garantie de disponibilité pour toutes les destinations.",
      },
      {
        heading: "3. Calcul et affichage des frais",
        body:
          "Les frais de livraison sont déterminés en fonction des solutions de transport disponibles pour la destination renseignée par le client. Le montant correspondant à chaque option disponible est communiqué avant la validation définitive de la commande. Le client peut ainsi comparer les tarifs proposés et sélectionner son mode de livraison avant de procéder au paiement. Le montant des frais de livraison est ajouté au prix des produits et apparaît dans le récapitulatif final de la commande. Aucun frais de livraison supplémentaire ne peut être ajouté après la validation de la commande sans accord du client.",
      },
      {
        heading: "4. Zones géographiques",
        body:
          "DINGRY a vocation à proposer la livraison dans les zones suivantes : France métropolitaine ; pays européens desservis ; destinations internationales desservies. Les possibilités de livraison et les tarifs associés varient selon le pays de destination et les services de transport disponibles. La liste des destinations effectivement accessibles est déterminée lors du passage de la commande. Si aucune solution de livraison n'est disponible pour une destination donnée, la commande ne pourra pas être finalisée pour cette destination.",
      },
      {
        heading: "5. Absence de livraison offerte",
        body:
          "Les frais de livraison restent à la charge du client, quel que soit le montant de sa commande. Toutefois, DINGRY se réserve la possibilité de proposer ponctuellement des offres promotionnelles portant sur les frais de livraison. Les conditions de ces offres seront alors précisées sur le site.",
      },
      {
        heading: "6. Modification des tarifs",
        body:
          "DINGRY se réserve le droit de modifier les frais de livraison en fonction de l'évolution des tarifs et des conditions appliqués par les transporteurs. Les tarifs applicables à une commande sont ceux affichés au moment de sa validation. Toute modification ultérieure ne s'applique pas rétroactivement aux commandes déjà confirmées.",
      },
      {
        heading: "7. Informations complémentaires",
        body: `Les modalités d'expédition, les délais estimés, le suivi des colis et les conditions de réception sont détaillés dans la section Livraison des Conditions générales de vente. Pour toute question concernant les frais de livraison, le client peut contacter le service client à l'adresse suivante : ${DINGRY_CONTACT_EMAIL}. DINGRY — Des pièces, pas des compromis.`,
      },
    ],
  },
};
