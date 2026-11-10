/** Identifiants catalogue — images uniquement via CRM (R2 + Supabase), plus de repli Cloudinary. */

const NO_LEGACY_IMAGE = "";

export const DINGRY_PRODUCT_MEDIA = {
  hoodieParisBlackRecto: NO_LEGACY_IMAGE,
  hoodieParisBlackVerso: NO_LEGACY_IMAGE,
  hoodieParisGreyRecto: NO_LEGACY_IMAGE,
  hoodieParisGreyVerso: NO_LEGACY_IMAGE,
  hoodieParisWhiteRecto: NO_LEGACY_IMAGE,
  hoodieParisWhiteVerso: NO_LEGACY_IMAGE,
  hoodieRoyalBlueRecto: NO_LEGACY_IMAGE,
  hoodieRoyalBlueVerso: NO_LEGACY_IMAGE,
  sweatRoyalBlueRecto: NO_LEGACY_IMAGE,
  sweatRoyalBlueVerso: NO_LEGACY_IMAGE,
  sweatNeonYellowRecto: NO_LEGACY_IMAGE,
  sweatNeonYellowVerso: NO_LEGACY_IMAGE,
  sweatPurpleRecto: NO_LEGACY_IMAGE,
  sweatPurpleVerso: NO_LEGACY_IMAGE,
  teeWhiteRecto: NO_LEGACY_IMAGE,
  teeWhiteVerso: NO_LEGACY_IMAGE,
  teeBlackRecto: NO_LEGACY_IMAGE,
  teeBlackVerso: NO_LEGACY_IMAGE,
  customConfiguratorBanner: NO_LEGACY_IMAGE,
  jerseyWhite: NO_LEGACY_IMAGE,
  jerseyBlack: NO_LEGACY_IMAGE,
  hoodieZipOutlineRecto: NO_LEGACY_IMAGE,
  hoodieZipOutlineVerso: NO_LEGACY_IMAGE,
} as const;

export const CATALOG_CANONICAL_IMAGE_BY_ID: Readonly<Record<number, string>> = {};

/** Paires Sweats (col rond) — visuels = CRM. */
export const DINGRY_SWEAT_CATALOG = [
  {
    pairId: 1,
    title: "SWEAT NEON YELLOW PARIS",
    reference: "DINGRY-S02",
    rectoId: 31,
    versoId: 32,
    rectoImage: NO_LEGACY_IMAGE,
    versoImage: NO_LEGACY_IMAGE,
    description:
      "Sweat col rond jaune fluo sans capuche, logo DINGRY Paris noir sur la poitrine.",
  },
  {
    pairId: 2,
    title: "SWEAT ROYAL BLUE RETRO",
    reference: "DINGRY-S01",
    rectoId: 33,
    versoId: 34,
    rectoImage: NO_LEGACY_IMAGE,
    versoImage: NO_LEGACY_IMAGE,
    description:
      "Sweat col rond bleu royal sans capuche, écriture Dingry jaune style rétro sur la poitrine.",
  },
  {
    pairId: 3,
    title: "CREWNECK DINGRY PURPLE",
    reference: "DINGRY-S03",
    rectoId: 39,
    versoId: 40,
    rectoImage: NO_LEGACY_IMAGE,
    versoImage: NO_LEGACY_IMAGE,
    description:
      "Sweat col rond violet sans capuche, logo DINGRY Paris rose sur la poitrine et éclair sur la manche.",
  },
] as const;

export const DINGRY_SWEAT_PRODUCT_IDS = new Set<number>(
  DINGRY_SWEAT_CATALOG.flatMap((entry) => [entry.rectoId, entry.versoId]),
);

export const DINGRY_TEE_PRODUCT_IDS = new Set<number>([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 24,
]);

export const DINGRY_JERSEY_PRODUCT_IDS = new Set<number>([41, 42]);
