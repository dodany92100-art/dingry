import type { CatalogSheetFieldKey } from "@/lib/catalog/sheet/types";

const FIELD_LABELS: Record<CatalogSheetFieldKey | "", string> = {
  "": "Fichier",
  brand: "Marque",
  modelName: "NOM MODÈLE",
  sku: "SKU",
  modelRef: "Réf. modèle",
  unitPrice: "PrixU",
  category: "Catégorie",
  color: "Coloris",
  size: "Taille",
  gender: "Genre",
  shortDescription: "Description courte",
  longDescription: "Description longue",
  composition: "Composition",
  highlights: "Points forts",
};

export function catalogSheetFieldLabel(field: CatalogSheetFieldKey | "" | undefined): string {
  if (!field) return "Fichier";
  return FIELD_LABELS[field] ?? field;
}