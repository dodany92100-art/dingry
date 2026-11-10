import type { ShopProduct } from "@/lib/catalog";
import { DINGRY_EDITORIAL_IMAGE_URL, DINGRY_TEASING_HERO_SRC } from "@/lib/dingry-brand";
import { DINGRY_PRODUCT_MEDIA } from "@/lib/dingry-product-media";

/** Taxonomie officielle marque — source {@link ./dingry-product-taxonomy.ts} */
export {
  ADMIN_PRODUCT_CATEGORY_NAV,
  OFFICIAL_PRODUCT_CATEGORIES,
  isOfficialProductCategory,
  type AdminProductCategoryFilter,
  type OfficialProductCategory,
} from "@/lib/dingry-product-taxonomy";

export const IMAGES = {
  hero1: DINGRY_TEASING_HERO_SRC,
  editorial: DINGRY_EDITORIAL_IMAGE_URL,
  hoodie1:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/hoodie1/1794331470853-emp7wu-hoodie1.webp",
  hoodie2:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/hoodie2/1794331491746-cu3g3x-hoodie2.webp",
  hoodie3:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/hoodie3/1794331522041-5xhivn-hoodie3.webp",
  hoodie4:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/hoodie4/1794331612245-e1e8d5-hoodie4.webp",
  hoodie5:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/hoodie5/1794331670297-4r365y-hoodie5.webp",
  hoodie6:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/hoodie6/1794331715578-wrsnh3-hoodie6.webp",
  hoodie7:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/hoodie7/1794331750008-72kewj-hoodie7.webp",
  hoodie8:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/hoodie8/1794331769827-e2bgg6-hoodie8.webp",
  cargo1: "https://images.unsplash.com/photo-1552902875-9ac1f9fe0c07?w=800&h=1000&fit=crop&auto=format",
  cargo2: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&h=1000&fit=crop&auto=format",
  bomber1: "https://images.unsplash.com/photo-1660486044177-45cd45bb5e99?w=800&h=1000&fit=crop&auto=format",
  bomber2: "https://images.unsplash.com/photo-1577471444692-4e7c23b51ce4?w=800&h=1000&fit=crop&auto=format",
  cap1: "",
  cap2: "",
  jersey1: DINGRY_PRODUCT_MEDIA.jerseyWhite,
  sneaker1: "https://images.unsplash.com/photo-1568153487049-4431a8c15c20?w=800&h=1000&fit=crop&auto=format",
  sneaker2: "https://images.unsplash.com/photo-1763750581767-b367bcd6c117?w=800&h=1000&fit=crop&auto=format",
  tee1: DINGRY_PRODUCT_MEDIA.teeWhiteVerso,
  tee2: "",
  tee3: "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/tee3/1794331773069-qvqd39-tee3.webp",
  tee4: DINGRY_PRODUCT_MEDIA.teeWhiteRecto,
  tee5: "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/tee5/1794331774103-pli1oe-tee5.webp",
  tee6: "",
  tee7: "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/tee7/1794331775363-elrxfe-tee7.webp",
  tee8: "",
  tee9: "",
  tee10: "",
  tee11: DINGRY_PRODUCT_MEDIA.teeBlackRecto,
  teeBlackVerso: DINGRY_PRODUCT_MEDIA.teeBlackVerso,
  tee12: "",
  tee13: "",
  hoodieParisBlackRecto: DINGRY_PRODUCT_MEDIA.hoodieParisBlackRecto,
  hoodieParisBlackVerso: DINGRY_PRODUCT_MEDIA.hoodieParisBlackVerso,
  hoodieParisGreyRecto: DINGRY_PRODUCT_MEDIA.hoodieParisGreyRecto,
  hoodieParisGreyVerso: DINGRY_PRODUCT_MEDIA.hoodieParisGreyVerso,
  hoodieParisWhiteRecto: DINGRY_PRODUCT_MEDIA.hoodieParisWhiteRecto,
  hoodieParisWhiteVerso: DINGRY_PRODUCT_MEDIA.hoodieParisWhiteVerso,
  hoodieRoyalBlueRecto: DINGRY_PRODUCT_MEDIA.hoodieRoyalBlueRecto,
  hoodieRoyalBlueVerso: DINGRY_PRODUCT_MEDIA.hoodieRoyalBlueVerso,
  sweatNeonYellowRecto: DINGRY_PRODUCT_MEDIA.sweatNeonYellowRecto,
  sweatNeonYellowVerso: DINGRY_PRODUCT_MEDIA.sweatNeonYellowVerso,
  sweatRoyalBlueRecto: DINGRY_PRODUCT_MEDIA.sweatRoyalBlueRecto,
  sweatRoyalBlueVerso: DINGRY_PRODUCT_MEDIA.sweatRoyalBlueVerso,
  sweatPurpleRecto: DINGRY_PRODUCT_MEDIA.sweatPurpleRecto,
  sweatPurpleVerso: DINGRY_PRODUCT_MEDIA.sweatPurpleVerso,
};

export const SIZES = ["S", "M", "L", "XL", "TU"] as const;

/** Stock par défaut si une fiche `PRODUCTS` n’a pas de `stock` explicite (admin / Redis). */
export const DEFAULT_SHOP_PRODUCT_STOCK = 10;

/** Valeurs par défaut ordre / épinglage (CRM + catalogue statique). */
export const DEFAULT_SHOP_PRODUCT_DISPLAY = {
  isPinned: false,
  displayOrder: 0,
} as const;

/** Quantité effective pour le CRM (jamais exposée au catalogue public). */
export function resolveShopProductStock(stock: number | undefined): number {
  if (stock === undefined || !Number.isFinite(stock)) return DEFAULT_SHOP_PRODUCT_STOCK;
  return Math.max(0, Math.floor(stock));
}

export const PERSONALIZATION_MAX_LABEL_LENGTH = 28;

/** Produit personnalisable (aligné sur le serveur : PERSONALIZABLE_PRODUCT_ID). */
export const PERSONALIZABLE_PRODUCT_ID = 24;

/** Maquettes recto (devant) — même logique que la PJ Paris / Marseille / Lyon */
export const PERSONALIZATION_SHIRTS = [
  {
    id: "noir",
    label: "Noir",
    image: IMAGES.tee11,
    cityTop: "57%",
    citySize: "clamp(0.55rem, 2.9vw, 0.82rem)",
    swatch: "#161616",
    swatchText: "#ffffff",
  },
  {
    id: "vert",
    label: "Vert",
    image: IMAGES.tee8,
    cityTop: "53%",
    citySize: "clamp(0.65rem, 3.1vw, 0.95rem)",
    swatch: "#1f4d32",
    swatchText: "#ffffff",
  },
  {
    id: "rouge",
    label: "Rouge",
    image: IMAGES.tee9,
    cityTop: "53%",
    citySize: "clamp(0.65rem, 3.1vw, 0.95rem)",
    swatch: "#8f1d2b",
    swatchText: "#ffffff",
  },
] as const;

export type PersonalizationShirtId = (typeof PERSONALIZATION_SHIRTS)[number]["id"];

/** Devant réel par collection (assets Cloudinary). */
const TEE_RECTO_IMAGE_BY_COLLECTION: Record<number, keyof typeof IMAGES> = {
  1: "tee4",
  3: "tee10",
  7: "tee8",
  9: "tee9",
  11: "tee11",
};

const TEE_RECTO_VARIANT_BY_COLLECTION: Record<number, string> = {
  1: "BLANC — RECTO",
  11: "NOIR — RECTO",
};

/** Dos du même modèle que le produit recto (id catalogue), pas collection n+1. */
export const TEE_VERSO_BY_RECTO_ID: Record<number, { image: keyof typeof IMAGES; variant: string }> = {
  11: { image: "tee1", variant: "BLANC — VERSO" },
  13: { image: "tee3", variant: "COLLECTION 03 — VERSO" },
  17: { image: "tee7", variant: "COLLECTION 07 — VERSO" },
  19: { image: "tee5", variant: "COLLECTION 09 — VERSO" },
  21: { image: "teeBlackVerso", variant: "NOIR — VERSO" },
};

/** Paires hoodies recto/verso (ids catalogue). */
export const HOODIE_PAIR_DEFS = [
  { id: 8, color: "Chocolat Paris", reference: "DINGRY-H08", versoId: 30, rectoId: 29 },
  { id: 9, color: "Blanc Paris", reference: "DINGRY-H09", versoId: 36, rectoId: 35 },
  { id: 5, color: "Gris Paris", reference: "DINGRY-H05", versoId: 28, rectoId: 27 },
  // Collection originale
  { id: 1, color: "Bleu roi", reference: "DINGRY-H01", versoId: 1, rectoId: 2 },
  { id: 2, color: "Vert original", reference: "DINGRY-H02", versoId: 3, rectoId: 7 },
  { id: 4, color: "Noir original", reference: "DINGRY-H04", versoId: 8, rectoId: 6 },
  { id: 3, color: "Noir zippé outline", reference: "DINGRY-H03", versoId: 5, rectoId: 4 },
] as const;

export const LOOKBOOK_ENTRIES = [
  [IMAGES.editorial, "DINGRY — Rock the Street", "Par Sully Sefil"],
  [IMAGES.hero1, "DINGRY Look Book", "Editorial"],
] as const;

/** Fiches statiques boutique — `stock?: number` optionnel (défaut {@link DEFAULT_SHOP_PRODUCT_STOCK}). */
export const PRODUCTS: ShopProduct[] = [
  {
    id: 1,
    name: "Hoodie DINGRY Original KING BLUE / PINK",
    variant: "VERSO",
    price: 80,
    image: IMAGES.hoodie1,
    description: "Coton lourd 480g, coupe oversize, capuche doublée. Finitions intérieures ton sur ton.",
    category: "Hoodies",
  },
  {
    id: 2,
    name: "Hoodie DINGRY Original KING BLUE / PINK",
    variant: "RECTO",
    price: 80,
    image: IMAGES.hoodie2,
    description: "Coloris king blue, broderie pink. Édition limitée.",
    category: "Hoodies",
  },
  {
    id: 3,
    name: "Hoodie DINGRY Original VERT",
    variant: "VERSO",
    price: 80,
    image: IMAGES.hoodie3,
    description: "Coton lourd, coupe oversize et signature DINGRY au dos.",
    category: "Hoodies",
  },
  {
    id: 4,
    name: "Hoodie zippé DINGRY Outline / BLACK",
    variant: "RECTO",
    price: 90,
    image: IMAGES.hoodie4,
    description: "Hoodie zippé noir, silhouette structurée et détails outline.",
    category: "Hoodies zippés",
  },
  {
    id: 5,
    name: "Hoodie zippé DINGRY Outline / BLACK",
    variant: "VERSO",
    price: 90,
    image: IMAGES.hoodie5,
    description: "Vue dos du hoodie zippé outline.",
    category: "Hoodies zippés",
  },
  {
    id: 6,
    name: "Hoodie DINGRY Original BLACK",
    variant: "RECTO",
    price: 80,
    image: IMAGES.hoodie6,
    description: "Le hoodie original DINGRY en noir, coupe oversize.",
    category: "Hoodies",
  },
  {
    id: 7,
    name: "Hoodie DINGRY Original VERT",
    variant: "RECTO",
    price: 80,
    image: IMAGES.hoodie7,
    description: "Le modèle original en vert, pensé pour la rue.",
    category: "Hoodies",
  },
  {
    id: 8,
    name: "Hoodie DINGRY Original BLACK",
    variant: "VERSO",
    price: 80,
    image: IMAGES.hoodie8,
    description: "Vue dos du hoodie original noir DINGRY.",
    category: "Hoodies",
  },
  ...Array.from({ length: 11 }, (_, index) => {
    const collection = index + 1;
    const inCatalog = collection in TEE_RECTO_IMAGE_BY_COLLECTION;
    const defaultKey = `tee${index + 1}` as keyof typeof IMAGES;
    const imageKey = TEE_RECTO_IMAGE_BY_COLLECTION[collection] ?? defaultKey;
    const rectoVariant =
      TEE_RECTO_VARIANT_BY_COLLECTION[collection] ??
      `COLLECTION ${String(collection).padStart(2, "0")} — RECTO`;
    return {
      id: 11 + index,
      name:
        collection === 1
          ? "T-shirt DINGRY Original WHITE"
          : collection === 11
            ? "T-shirt DINGRY Original BLACK"
            : "DINGRY TEE",
      variant: inCatalog ? rectoVariant : `COLLECTION ${String(collection).padStart(2, "0")} — VERSO`,
      price: collection === 1 || collection === 11 ? 35 : 119,
      image: IMAGES[imageKey] ?? IMAGES.tee1,
      description: "",
      category: "T-shirts",
    };
  }),
  {
    id: 22,
    name: "DINGRY TEE FEMME",
    variant: "ORIGINAL — RECTO",
    price: 35,
    image: IMAGES.tee12,
    description: "",
    category: "T-shirts",
  },
  {
    id: 24,
    name: "DINGRY TEE",
    variant: "PERSONNALISÉ — RECTO",
    price: 35,
    image: IMAGES.tee11,
    description: "T-shirt noir personnalisable — ville ou texte sous le logo (+5€).",
    category: "T-shirts",
  },
  {
    id: 25,
    name: "HOODIE BLACK PARIS BACK-LOGO",
    variant: "NOIR PARIS — RECTO",
    price: 80,
    image: IMAGES.hoodieParisBlackRecto,
    description:
      "Hoodie noir avec logo DINGRY Paris sur la poitrine, éclairs sur les manches et grand print vertical DINGRY au dos.",
    category: "Hoodies",
  },
  {
    id: 26,
    name: "HOODIE BLACK PARIS BACK-LOGO",
    variant: "NOIR PARIS — VERSO",
    price: 80,
    image: IMAGES.hoodieParisBlackVerso,
    description: "",
    category: "Hoodies",
  },
  {
    id: 27,
    name: "Hoodie DINGRY Original GREY",
    variant: "RECTO",
    price: 80,
    image: IMAGES.hoodieParisGreyRecto,
    description: "Hoodie gris chiné, logo DINGRY sur la poitrine et statement au dos.",
    category: "Hoodies",
  },
  {
    id: 28,
    name: "Hoodie DINGRY Original GREY",
    variant: "VERSO",
    price: 80,
    image: IMAGES.hoodieParisGreyVerso,
    description: "",
    category: "Hoodies",
  },
  {
    id: 29,
    name: "Hoodie DINGRY Original CHOCOLAT",
    variant: "RECTO",
    price: 80,
    image: IMAGES.hoodieRoyalBlueRecto,
    description: "Hoodie chocolat à capuche, logo DINGRY sur la poitrine.",
    category: "Hoodies",
  },
  {
    id: 30,
    name: "Hoodie DINGRY Original CHOCOLAT",
    variant: "VERSO",
    price: 80,
    image: IMAGES.hoodieRoyalBlueVerso,
    description: "",
    category: "Hoodies",
  },
  {
    id: 35,
    name: "Hoodie DINGRY Original WHITE",
    variant: "RECTO",
    price: 80,
    image: IMAGES.hoodieParisWhiteRecto,
    description: "Hoodie blanc, logo DINGRY sur la poitrine et statement au dos.",
    category: "Hoodies",
  },
  {
    id: 36,
    name: "Hoodie DINGRY Original WHITE",
    variant: "VERSO",
    price: 80,
    image: IMAGES.hoodieParisWhiteVerso,
    description: "",
    category: "Hoodies",
  },
  {
    id: 31,
    name: "Crewneck DINGRY Original YELLOW FLUO",
    variant: "RECTO",
    price: 50,
    image: IMAGES.sweatNeonYellowRecto,
    description: "Sweat col rond jaune fluo sans capuche, logo DINGRY Paris noir sur la poitrine.",
    category: "Crewnecks",
  },
  {
    id: 32,
    name: "Crewneck DINGRY Original YELLOW FLUO",
    variant: "VERSO",
    price: 50,
    image: IMAGES.sweatNeonYellowVerso,
    description: "",
    category: "Crewnecks",
  },
  {
    id: 33,
    name: "Crewneck DINGRY Original BLUE / YELLOW",
    variant: "RECTO",
    price: 50,
    image: IMAGES.sweatRoyalBlueRecto,
    description: "Sweat col rond bleu royal sans capuche, écriture Dingry jaune style rétro sur la poitrine.",
    category: "Crewnecks",
  },
  {
    id: 34,
    name: "Crewneck DINGRY Original BLUE / YELLOW",
    variant: "VERSO",
    price: 50,
    image: IMAGES.sweatRoyalBlueVerso,
    description: "",
    category: "Crewnecks",
  },
  {
    id: 39,
    name: "Crewneck DINGRY Original PURPLE / PINK",
    variant: "RECTO",
    price: 50,
    image: IMAGES.sweatPurpleRecto,
    description: "Sweat col rond violet sans capuche, logo DINGRY Paris rose sur la poitrine et éclair sur la manche.",
    category: "Crewnecks",
  },
  {
    id: 40,
    name: "Crewneck DINGRY Original PURPLE / PINK",
    variant: "VERSO",
    price: 50,
    image: IMAGES.sweatPurpleVerso,
    description: "",
    category: "Crewnecks",
  },
  {
    id: 37,
    name: "CAP DINGRY Original BLACK",
    variant: "TU",
    price: 40,
    image: IMAGES.cap1,
    description: "Casquette noire, logo DINGRY blanc sur l'avant et marque sur la bride.",
    category: "Caps",
    sizes: ["TU"],
  },
  {
    id: 38,
    name: "CAP DINGRY Original RED",
    variant: "TU",
    price: 40,
    image: IMAGES.cap2,
    description: "Casquette rouge, logo DINGRY blanc sur l'avant et marque sur la bride.",
    category: "Caps",
    sizes: ["TU"],
  },
  {
    id: 41,
    name: "JERSEY DINGRY",
    variant: "BLANC",
    price: 129,
    image: DINGRY_PRODUCT_MEDIA.jerseyWhite,
    description: "Jersey mesh blanc, logo DINGRY Paris noir sur la poitrine et éclairs sur les manches.",
    category: "Jerseys",
  },
  {
    id: 42,
    name: "JERSEY DINGRY",
    variant: "NOIR",
    price: 129,
    image: DINGRY_PRODUCT_MEDIA.jerseyBlack,
    description: "Jersey mesh noir, logo DINGRY Paris sur la poitrine et éclairs sur les manches.",
    category: "Jerseys",
  },
];
