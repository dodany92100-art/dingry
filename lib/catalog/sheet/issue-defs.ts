import type { CatalogSheetFieldKey } from "@/lib/catalog/sheet/types";

export type CatalogSheetIssueDef = {
  field?: CatalogSheetFieldKey | "";
  fixHint: string;
  defaultMessage?: string;
};

/** Métadonnées diagnostics par code (messages / hints CRM — inchangés). */
export const CATALOG_SHEET_ISSUE_DEFS: Record<string, CatalogSheetIssueDef> = {
  brand_missing: {
    field: "brand",
    fixHint: "Indique une marque reconnue : FYMA, DINGRY ou ROCK THE STREET (ou laisse le SKU FYM/DIN/RTS déduire la marque).",
    defaultMessage: "Marque manquante ou non reconnue.",
  },
  sku_missing: {
    field: "sku",
    fixHint: "Renseigne un SKU unique par variante (5 blocs séparés par des tirets).",
    defaultMessage: "SKU manquant.",
  },
  sku_invalid: {
    field: "sku",
    fixHint:
      "Format attendu : MARQUE-TYPE-MODELE-COLORIS-TAILLE (ex. FYM-CAP-BRO-NOI-U). Taille unique = bloc final U (pas TU).",
    defaultMessage: "SKU hors convention 5 blocs.",
  },
  model_ref_missing: {
    field: "modelRef",
    fixHint:
      "Renseigne la Réf. modèle (3 premiers blocs du SKU, ex. FYM-CAP-BRO) ou laisse vide si le SKU est valide (déduction auto).",
    defaultMessage: "Réf. modèle manquante.",
  },
  model_ref_sku_mismatch: {
    field: "modelRef",
    fixHint: "La Réf. modèle doit être identique aux 3 premiers segments du SKU (ex. SKU FYM-PUL-FLU-BEI-M → FYM-PUL-FLU).",
    defaultMessage: "Réf. modèle incohérente avec le SKU.",
  },
  model_ref_inferred: {
    field: "modelRef",
    fixHint: "Optionnel : tu peux remplir la colonne Réf. modèle pour contrôle visuel (déjà déduite du SKU).",
    defaultMessage: "Réf. modèle déduite automatiquement du SKU.",
  },
  price_invalid: {
    field: "unitPrice",
    fixHint: "Saisis un nombre positif : 40, 40 €, 60,00 € ou 120.50 EUR (sans texte superflu).",
    defaultMessage: "Prix unitaire illisible ou non positif.",
  },
  category_invalid: {
    field: "category",
    fixHint: "Choisis une catégorie boutique : Caps, T-shirts, Hoodies, Crewnecks, Jerseys, Pants, Crop tops, Hoodzip…",
    defaultMessage: "Catégorie manquante ou inconnue.",
  },
  size_invalid: {
    field: "size",
    fixHint: "Tailles acceptées : XS–XXL, 2XL (→ XXL au SKU), TU/Taille unique/U pour casquettes.",
    defaultMessage: "Taille non reconnue.",
  },
  size_sku_mismatch: {
    field: "size",
    fixHint:
      "Aligne la colonne Taille avec le dernier bloc du SKU (ex. TU en feuille ↔ U dans le SKU ; M ↔ -M).",
    defaultMessage: "Taille de la feuille incompatible avec le SKU.",
  },
  color_missing: {
    field: "color",
    fixHint: "Renseigne le coloris (Noir, Rouge, Beige…) aligné avec le bloc COLORIS du SKU (NOI, ROU, BEI…).",
    defaultMessage: "Coloris manquant.",
  },
  model_name_missing: {
    field: "modelName",
    fixHint: "Donne un libellé produit (NOM MODÈLE) pour l’admin / la boutique.",
    defaultMessage: "NOM MODÈLE manquant.",
  },
  color_sku_drift: {
    field: "color",
    fixHint: "Harmonise le libellé coloris avec le code SKU ou corrige le SKU (ex. Noir → NOI).",
    defaultMessage: "Écart entre coloris saisi et bloc COLORIS du SKU.",
  },
  category_sku_type_drift: {
    field: "category",
    fixHint:
      "Vérifie cohérence catégorie vs type SKU (ex. Crewnecks en boutique avec type PUL dans le SKU FYMA : souvent volontaire).",
    defaultMessage: "Écart catégorie feuille / type SKU.",
  },
  sku_taille_tu_normalized: {
    field: "sku",
    fixHint: "En SKU utilise U pour taille unique ; conserve TU dans la colonne Taille.",
    defaultMessage: "Suffixe SKU -TU converti en -U.",
  },
  csv_empty: {
    fixHint: "Exporte au moins une ligne de données avec les en-têtes (Marque, SKU, Prix…).",
    defaultMessage: "CSV vide ou sans données.",
  },
  csv_header_missing: {
    fixHint: "Ajoute une ligne d’en-têtes avec Marque, SKU, Réf. modèle, PrixU, Catégorie, Coloris, Taille…",
    defaultMessage: "En-têtes de colonnes introuvables.",
  },
  json_invalid: { fixHint: "Envoie un JSON objet avec un tableau rows[].", defaultMessage: "JSON invalide." },
  json_rows_missing: { fixHint: "Ajoute rows[] ou variants[] dans le JSON.", defaultMessage: "Tableau rows[] manquant." },
  row_invalid: { fixHint: "Chaque ligne doit être un objet avec les colonnes catalogue.", defaultMessage: "Ligne invalide." },
  duplicate_size: {
    field: "size",
    fixHint: "Une seule ligne par taille pour un même modèle + coloris ; fusionne ou corrige les SKU en double.",
    defaultMessage: "Doublon de taille avec SKU différents.",
  },
  price_spread: {
    field: "unitPrice",
    fixHint: "Unifie le PrixU pour toutes les tailles d’un même modèle + coloris.",
    defaultMessage: "Prix différents sur des variantes du même coloris.",
  },
};