import type { CatalogSheetFieldKey } from "@/lib/catalog/sheet/types";

/** En-têtes feuille CATALOGUE (FR) → clés internes. */
const CATALOG_SHEET_HEADER_ALIASES: Record<string, CatalogSheetFieldKey> = {
  marque: "brand",
  brand: "brand",
  "nom modele": "modelName",
  "nom modèle": "modelName",
  "nom_modele": "modelName",
  modelname: "modelName",
  model_name: "modelName",
  sku: "sku",
  "réf. modèle": "modelRef",
  "ref. modele": "modelRef",
  "ref modele": "modelRef",
  modelref: "modelRef",
  model_ref: "modelRef",
  prixu: "unitPrice",
  "prix u": "unitPrice",
  prix: "unitPrice",
  unitprice: "unitPrice",
  unit_price: "unitPrice",
  catégorie: "category",
  categorie: "category",
  category: "category",
  coloris: "color",
  couleur: "color",
  color: "color",
  taille: "size",
  size: "size",
  genre: "gender",
  gender: "gender",
  "description courte": "shortDescription",
  shortdescription: "shortDescription",
  short_description: "shortDescription",
  "description longue": "longDescription",
  longdescription: "longDescription",
  long_description: "longDescription",
  composition: "composition",
  "points forts": "highlights",
  pointsforts: "highlights",
  highlights: "highlights",
  // clés compactes (sans espaces / ponctuation)
  nommodele: "modelName",
  refmodele: "modelRef",
  descriptioncourte: "shortDescription",
  descriptionlongue: "longDescription",
};

export const CATALOG_SHEET_FIELD_KEYS = new Set<string>([
  "brand",
  "modelName",
  "sku",
  "modelRef",
  "unitPrice",
  "category",
  "color",
  "size",
  "gender",
  "shortDescription",
  "longDescription",
  "composition",
  "highlights",
]);

/** Clé d’en-tête normalisée (sans accents, ponctuation → espaces). */
export function compactCatalogSheetHeaderKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[._]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeCatalogSheetHeader(raw: string): CatalogSheetFieldKey | null {
  const key = compactCatalogSheetHeaderKey(raw);
  const direct = CATALOG_SHEET_HEADER_ALIASES[key];
  if (direct) return direct;
  const compact = key.replace(/\s+/g, "");
  const compactHit = CATALOG_SHEET_HEADER_ALIASES[compact];
  if (compactHit) return compactHit;
  if (CATALOG_SHEET_FIELD_KEYS.has(key)) return key as CatalogSheetFieldKey;
  if (key.startsWith("ref") && key.includes("modele")) return "modelRef";
  if (key.startsWith("nom") && key.includes("modele")) return "modelName";
  if (key === "prix" || key.startsWith("prix")) return "unitPrice";
  if (key.startsWith("desc") && key.includes("court")) return "shortDescription";
  if (key.startsWith("desc") && key.includes("long")) return "longDescription";
  return null;
}
