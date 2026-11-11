/** Textes panier / checkout (FR). */
export const DINGRY_SHIPPING_LABEL = "Frais de livraison";
export const DINGRY_SHIPPING_AMOUNT_HINT = "Selon destination";
export const DINGRY_DELIVERY_ESTIMATE =
  "Tarif et délai confirmés avant paiement (estimation France : 3 à 7 jours ouvrés).";

/** Réassurance panier / checkout — alignée CGV, politique livraison et retours (`lib/legal-placeholders.ts`). */
export const DINGRY_CART_REASSURANCE_EYEBROW = "Informations";
export const DINGRY_CART_REASSURANCE_ITEMS = [
  "Délais indicatifs : 3 à 7 jours ouvrés en France métropolitaine, sauf indication contraire à la commande.",
  "Frais de livraison à votre charge, selon destination et transporteur — montant communiqué avant validation (PayPal).",
  "Droit de rétractation : 14 jours après réception. Frais de retour à votre charge sauf article défectueux ou erreur DINGRY.",
  "Paiement via PayPal (compte ou carte lorsque proposé par PayPal). Commande ferme après confirmation du paiement.",
] as const;
