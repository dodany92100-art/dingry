/** URLs Cloudinary canoniques — source unique boutique + admin. */

export const DINGRY_PRODUCT_MEDIA = {
  hoodieParisBlackRecto:
    "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793122064/DINGRY_HOODIE_ORIGINAL_BLACK_RECTO_knvlfw.png",
  hoodieParisBlackVerso:
    "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793122061/DINGRY_-_HOODIE_ORIGINAL_BLACK_VERSO_llv6wk.png",
  hoodieParisGreyRecto:
    "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793306684/ca6a0e1d-0d92-4874-a19f-ec5a17c55a01_decasg.jpg",
  hoodieParisGreyVerso:
    "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793306684/91bdf646-f629-4a1d-820c-9970f030082b_i9iifq.jpg",
  hoodieParisWhiteRecto:
    "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793305029/WhatsApp_Image_2026-10-29_at_21.10.29_6_knkft7.jpg",
  hoodieParisWhiteVerso:
    "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793305029/WhatsApp_Image_2026-10-29_at_21.10.29_7_b0lt3a.jpg",
  hoodieRoyalBlueRecto:
    "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793305029/WhatsApp_Image_2026-10-29_at_21.10.29_4_uqwkfr.jpg",
  hoodieRoyalBlueVerso:
    "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793305029/WhatsApp_Image_2026-10-29_at_21.10.29_5_qxfgih.jpg",
  sweatRoyalBlueRecto:
    "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793305028/WhatsApp_Image_2026-10-29_at_21.10.45_2_ntnuvz.jpg",
  sweatRoyalBlueVerso:
    "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793305028/WhatsApp_Image_2026-10-29_at_21.10.45_3_bgh9ug.jpg",
  sweatNeonYellowRecto:
    "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793306684/2a7fbbbe-54b9-4f5a-bc83-c5c77fb34b1d_hf0rly.jpg",
  sweatNeonYellowVerso:
    "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793306684/1deacdcc-f442-4f5c-9517-68dd3fd2d3ed_jop32c.jpg",
  sweatPurpleRecto:
    "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793310835/12120bb3-b57d-4e75-98dc-9632da0ec185_yp1rlt.jpg",
  sweatPurpleVerso:
    "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793310835/695caaa9-f70e-410c-a315-4cc9170bf009_jehxos.jpg",
  teeWhiteRecto:
    "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793315162/10324a1f-74eb-49cc-93b4-f0a118abc4fd_pqku5a.jpg",
  teeWhiteVerso:
    "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793315162/a673505c-3fd5-4146-ad69-0557ec774686_ohpztn.jpg",
  teeBlackRecto:
    "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793315162/c613df1f-7feb-4d7f-a1c2-d1018d94302b_tkal8j.jpg",
  teeBlackVerso:
    "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793315162/f5c4805b-561d-4c9c-92d1-9e61a6c824e4_soqs1x.jpg",
  jerseyWhite:
    "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793310835/31908e1d-4023-4ed0-be80-f3c114bbb097_kz5cef.jpg",
  jerseyBlack:
    "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793310836/e2110850-29a4-4e76-aeb4-1972601d467d_cgyeld.jpg",
} as const;

/** Images catalogue figées (priorité sur l’admin pour ces ids). */
export const CATALOG_CANONICAL_IMAGE_BY_ID: Readonly<Record<number, string>> = {
  25: DINGRY_PRODUCT_MEDIA.hoodieParisBlackRecto,
  26: DINGRY_PRODUCT_MEDIA.hoodieParisBlackVerso,
  27: DINGRY_PRODUCT_MEDIA.hoodieParisGreyRecto,
  28: DINGRY_PRODUCT_MEDIA.hoodieParisGreyVerso,
  29: DINGRY_PRODUCT_MEDIA.hoodieRoyalBlueRecto,
  30: DINGRY_PRODUCT_MEDIA.hoodieRoyalBlueVerso,
  31: DINGRY_PRODUCT_MEDIA.sweatNeonYellowRecto,
  32: DINGRY_PRODUCT_MEDIA.sweatNeonYellowVerso,
  33: DINGRY_PRODUCT_MEDIA.sweatRoyalBlueRecto,
  34: DINGRY_PRODUCT_MEDIA.sweatRoyalBlueVerso,
  35: DINGRY_PRODUCT_MEDIA.hoodieParisWhiteRecto,
  36: DINGRY_PRODUCT_MEDIA.hoodieParisWhiteVerso,
  39: DINGRY_PRODUCT_MEDIA.sweatPurpleRecto,
  40: DINGRY_PRODUCT_MEDIA.sweatPurpleVerso,
  11: DINGRY_PRODUCT_MEDIA.teeWhiteRecto,
  21: DINGRY_PRODUCT_MEDIA.teeBlackRecto,
  41: DINGRY_PRODUCT_MEDIA.jerseyWhite,
  42: DINGRY_PRODUCT_MEDIA.jerseyBlack,
};

/** Paires catalogue Sweats (col rond) — images figées, jamais les hoodies H08/H09. */
export const DINGRY_SWEAT_CATALOG = [
  {
    pairId: 1,
    title: "SWEAT NEON YELLOW PARIS",
    reference: "DINGRY-S02",
    rectoId: 31,
    versoId: 32,
    rectoImage: DINGRY_PRODUCT_MEDIA.sweatNeonYellowRecto,
    versoImage: DINGRY_PRODUCT_MEDIA.sweatNeonYellowVerso,
    description:
      "Sweat col rond jaune fluo sans capuche, logo DINGRY Paris noir sur la poitrine.",
  },
  {
    pairId: 2,
    title: "SWEAT ROYAL BLUE RETRO",
    reference: "DINGRY-S01",
    rectoId: 33,
    versoId: 34,
    rectoImage: DINGRY_PRODUCT_MEDIA.sweatRoyalBlueRecto,
    versoImage: DINGRY_PRODUCT_MEDIA.sweatRoyalBlueVerso,
    description:
      "Sweat col rond bleu royal sans capuche, écriture Dingry jaune style rétro sur la poitrine.",
  },
  {
    pairId: 3,
    title: "CREWNECK DINGRY PURPLE",
    reference: "DINGRY-S03",
    rectoId: 39,
    versoId: 40,
    rectoImage: DINGRY_PRODUCT_MEDIA.sweatPurpleRecto,
    versoImage: DINGRY_PRODUCT_MEDIA.sweatPurpleVerso,
    description:
      "Sweat col rond violet sans capuche, logo DINGRY Paris rose sur la poitrine et éclair sur la manche.",
  },
] as const;

export const DINGRY_SWEAT_PRODUCT_IDS = new Set<number>(
  DINGRY_SWEAT_CATALOG.flatMap((entry) => [entry.rectoId, entry.versoId]),
);

/** IDs t-shirts boutique (recto + verso + perso) — catégorie figée côté shop. */
export const DINGRY_TEE_PRODUCT_IDS = new Set<number>([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
]);

export const DINGRY_JERSEY_PRODUCT_IDS = new Set<number>([41, 42]);
