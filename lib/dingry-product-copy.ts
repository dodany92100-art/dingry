import { resolveRectoCatalogId } from "@/lib/catalog-verso-recto";
import type { ShopProduct } from "@/lib/catalog";

/** URL boutique : `/?produit=hoodie-dingry-original-black` */
export const DINGRY_PRODUCT_SLUG_BY_RECTO_ID: Readonly<Record<number, string>> = {
  2: "hoodie-dingry-original-king-blue-pink",
  4: "hoodie-zippe-dingry-outline-black",
  6: "hoodie-dingry-original-black",
  7: "hoodie-dingry-original-vert",
  11: "t-shirt-dingry-original-white",
  21: "t-shirt-dingry-original-black",
  24: "t-shirt-dingry-custom-personnalise",
  27: "hoodie-dingry-original-grey",
  29: "hoodie-dingry-original-chocolat",
  31: "crewneck-dingry-original-yellow-fluo",
  33: "crewneck-dingry-original-blue-yellow",
  35: "hoodie-dingry-original-white",
  37: "cap-dingry-original-black",
  38: "cap-dingry-original-red",
  39: "crewneck-dingry-original-purple-pink",
  41: "jersey-dingry-mesh-white",
  42: "jersey-dingry-mesh-black",
};

const RECTO_BY_SLUG = new Map<string, number>(
  Object.entries(DINGRY_PRODUCT_SLUG_BY_RECTO_ID).map(([id, slug]) => [slug, Number(id)]),
);

export function productSlugForCatalogId(catalogId: number): string | null {
  const rectoId = resolveRectoCatalogId(catalogId);
  return DINGRY_PRODUCT_SLUG_BY_RECTO_ID[rectoId] ?? null;
}

export function rectoIdFromProductSlug(slug: string): number | null {
  const key = slug.trim().toLowerCase();
  return RECTO_BY_SLUG.get(key) ?? null;
}

export type ProductStoryBlock = {
  lead: string;
  materials: string;
  fabrication: string;
  limitedEdition: string;
  sizeGuide: string;
};

const DEFAULT_SIZE_GUIDE =
  "Coupe oversize unisexe. Taille habituelle = fit relaxed streetwear ; une taille en dessous pour un porté plus près du corps.";

const STORY_BY_RECTO: Partial<Record<number, ProductStoryBlock>> = {
  6: {
    lead:
      "Hoodie streetwear oversize en coton lourd : chaleur, tenue impeccable et logo DINGRY visible de jour comme de nuit. Le noir profond qui s’accorde avec tout votre vestiaire urbain.",
    materials: "Coton 480 g/m², intérieur gratté, capuche doublée, bords-côtes renforcés.",
    fabrication: "Broderies et sérigraphies contrôlées, assemblage suivi, contrôle qualité avant expédition.",
    limitedEdition: "Séries limitées par coloris.",
    sizeGuide: DEFAULT_SIZE_GUIDE,
  },
  2: {
    lead:
      "Le coloris king blue / pink : un hoodie DINGRY Original qui marque le style sans crier. Idéal pour un look streetwear premium et des photos éditoriales.",
    materials: "Coton 480 g/m² premium, gratté, capuche structurée.",
    fabrication: "Coloris exclusif boutique, finitions ton sur ton, même exigence que la ligne Original.",
    limitedEdition: "Drop limité — quand le stock est épuisé, le coloris ne revient pas automatiquement.",
    sizeGuide: DEFAULT_SIZE_GUIDE,
  },
  7: {
    lead:
      "Vert signature DINGRY : attitude, visibilité et confort pour vos trajets ville / soirée. Hoodie unisexe pensé pour la scène urbaine française.",
    materials: "Coton lourd 480 g/m², intérieur doux, capuche épaisse.",
    fabrication: "Impression dos haute tenue, broderie poitrine, contrôle des tailles avant mise en ligne.",
    limitedEdition: "Production limitée par vague — pas de réassort massif.",
    sizeGuide: DEFAULT_SIZE_GUIDE,
  },
  29: {
    lead:
      "Chocolat profond, esprit workwear luxe : un hoodie Original qui sort des basiques noirs tout en restant ultra wearable.",
    materials: "Coton premium gratté, même coupe que la ligne Original.",
    fabrication: "Teinture stable, sérigraphie dos, finitions soignées.",
    limitedEdition: "Coloris capsule — stocks numérotés dans le CRM.",
    sizeGuide: DEFAULT_SIZE_GUIDE,
  },
  27: {
    lead:
      "Gris chiné discret, logo affirmé : le hoodie DINGRY pour un streetwear minimaliste et des superpositions layering.",
    materials: "Coton mélangé gratté 480 g/m², toucher moelleux.",
    fabrication: "Broderie poitrine + print vertical dos, contrôle qualité.",
    limitedEdition: "Édition limitée par saison.",
    sizeGuide: DEFAULT_SIZE_GUIDE,
  },
  35: {
    lead:
      "Blanc éclatant pour contraster en lookbook ou en scène : hoodie Original DINGRY, même coupe iconique, finitions propres.",
    materials: "Coton épais, capuche doublée, bords-côtes premium.",
    fabrication: "Encres résistantes au lavage, assemblage renforcé aux points de tension.",
    limitedEdition: "Quantités limitées.",
    sizeGuide: DEFAULT_SIZE_GUIDE,
  },
  4: {
    lead:
      "Hoodie zippé outline : silhouette structurée, fermeture YKK, détails contrastés. Le layering streetwear haut de gamme.",
    materials: "Coton 450 g/m², zip YKK, broderies outline.",
    fabrication: "Patron oversize, broderies positionnées, contrôle zip.",
    limitedEdition: "Ligne Outline — variantes BLACK en stock, autres coloris annoncés.",
    sizeGuide: DEFAULT_SIZE_GUIDE,
  },
  11: {
    lead:
      "T-shirt DINGRY Original blanc : base clean pour logo poitrine, superpositions ou custom. Coton confortable pour le quotidien streetwear.",
    materials: "Coton jersey premium, col rib.",
    fabrication: "Coupe unisexe, sérigraphie durable.",
    limitedEdition: "Réassort limité — vérifiez les tailles disponibles.",
    sizeGuide: "Coupe regular unisexe. Prenez votre taille pour un porté standard.",
  },
  21: {
    lead:
      "T-shirt noir DINGRY Original : l’essential du dressing urbain, compatible casquette et hoodie de la même ligne.",
    materials: "Coton jersey épais, finition soft touch.",
    fabrication: "Sérigraphie haute densité, contrôle des tailles.",
    limitedEdition: "Stock limité par taille.",
    sizeGuide: "Coupe regular unisexe.",
  },
  24: {
    lead:
      "T-shirt personnalisable DINGRY : ville, pays ou texte sous le logo. Votre pièce unique, fabriquée à la demande (+5 € de personnalisation).",
    materials: "Coton jersey premium, impression personnalisée.",
    fabrication: "Texte appliqué après validation — contrôle orthographe inclus.",
    limitedEdition: "Chaque commande custom est produite en série courte.",
    sizeGuide: "Coupe regular unisexe.",
  },
  31: {
    lead:
      "Crewneck jaune fluo : impact visuel maximum, col rond sans capuche, logo DINGRY Paris.",
    materials: "Coton gratté, col rond renforcé.",
    fabrication: "Teinture fluo stable, sérigraphie poitrine.",
    limitedEdition: "Coloris limité — crewneck collector.",
    sizeGuide: DEFAULT_SIZE_GUIDE,
  },
  33: {
    lead:
      "Crewneck bleu / jaune rétro : esprit archive sportswear, typo Dingry sur la poitrine.",
    materials: "Coton premium, finitions col rond.",
    fabrication: "Sérigraphie rétro, contrôle colorimétrique.",
    limitedEdition: "Drop crewneck — stock limité.",
    sizeGuide: DEFAULT_SIZE_GUIDE,
  },
  39: {
    lead:
      "Crewneck violet / rose : touche colorée, logo DINGRY Paris et détail éclair sur la manche.",
    materials: "Coton gratté, broderie / print mix.",
    fabrication: "Assemblage premium, contrôle des alignements.",
    limitedEdition: "Série courte par coloris.",
    sizeGuide: DEFAULT_SIZE_GUIDE,
  },
  37: {
    lead:
      "Casquette DINGRY noire : finition streetwear, logo brodé avant, bride réglable.",
    materials: "Coton sergé, visière structurée.",
    fabrication: "Broderie haute définition, bride métal.",
    limitedEdition: "Taille unique TU — stock limité.",
    sizeGuide: "Taille unique avec bride réglable.",
  },
  38: {
    lead:
      "Casquette rouge DINGRY : contraste fort, même qualité de broderie que la casquette noire.",
    materials: "Coton sergé premium.",
    fabrication: "Broderie logo, contrôle qualité avant envoi.",
    limitedEdition: "Accessoire capsule — quantités limitées.",
    sizeGuide: "Taille unique TU.",
  },
  41: {
    lead:
      "Jersey mesh blanc DINGRY : esprit sport luxe, logo Paris, éclairs manches.",
    materials: "Mesh polyester / coton, finitions col V.",
    fabrication: "Sublimation / broderie selon zone, contrôle des mailles.",
    limitedEdition: "Jersey numéroté par vague de production.",
    sizeGuide: DEFAULT_SIZE_GUIDE,
  },
  42: {
    lead:
      "Jersey mesh noir : même coupe que le blanc, logo contrasté, look basketball street premium.",
    materials: "Mesh technique, col renforcé.",
    fabrication: "Assemblage sportswear, contrôle stretch.",
    limitedEdition: "Production limitée.",
    sizeGuide: DEFAULT_SIZE_GUIDE,
  },
};

const CATEGORY_FALLBACK: ProductStoryBlock = {
  lead:
    "Pièce DINGRY en édition limitée : design affirmé, finitions soignées et stock contrôlé pour un streetwear premium accessible.",
  materials: "Matières sélectionnées pour tenue, confort et durabilité au quotidien.",
  fabrication: "Impression, broderie et assemblage suivis avant expédition.",
  limitedEdition: "",
  sizeGuide: DEFAULT_SIZE_GUIDE,
};

export function productStoryForCatalogId(catalogId: number): ProductStoryBlock {
  const rectoId = resolveRectoCatalogId(catalogId);
  return STORY_BY_RECTO[rectoId] ?? CATEGORY_FALLBACK;
}

export function productStoryForShopProduct(product: ShopProduct): ProductStoryBlock {
  return productStoryForCatalogId(product.id);
}
