/** Visuels catalogue (repli flip / seed) — R2 `dingry/legacy/*`. */

export const DINGRY_PRODUCT_MEDIA = {
  hoodieParisBlackRecto:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/hoodieParisBlackRecto/1794331801429-fdh0v0-hoodieParisBlackRecto.webp",
  hoodieParisBlackVerso:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/hoodieParisBlackVerso/1794331821166-kk1ded-hoodieParisBlackVerso.webp",
  hoodieParisGreyRecto:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/hoodieParisGreyRecto/1794331823379-t6wms0-hoodieParisGreyRecto.webp",
  hoodieParisGreyVerso:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/hoodieParisGreyVerso/1794331825936-han2k9-hoodieParisGreyVerso.webp",
  hoodieParisWhiteRecto:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/hoodieParisWhiteRecto/1794331827739-ijcgir-hoodieParisWhiteRecto.webp",
  hoodieParisWhiteVerso:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/hoodieParisWhiteVerso/1794331830138-smihyy-hoodieParisWhiteVerso.webp",
  hoodieRoyalBlueRecto:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/hoodieRoyalBlueRecto/1794331831687-3p8ntq-hoodieRoyalBlueRecto.webp",
  hoodieRoyalBlueVerso:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/hoodieRoyalBlueVerso/1794331833036-rteg6x-hoodieRoyalBlueVerso.webp",
  sweatRoyalBlueRecto:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/sweatRoyalBlueRecto/1794331841412-hwv75c-sweatRoyalBlueRecto.webp",
  sweatRoyalBlueVerso:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/sweatRoyalBlueVerso/1794331843026-foiijx-sweatRoyalBlueVerso.webp",
  sweatNeonYellowRecto:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/sweatNeonYellowRecto/1794331835784-56e21q-sweatNeonYellowRecto.webp",
  sweatNeonYellowVerso:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/sweatNeonYellowVerso/1794331839135-zxpih3-sweatNeonYellowVerso.webp",
  sweatPurpleRecto:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/sweatPurpleRecto/1794331844251-t482sl-sweatPurpleRecto.webp",
  sweatPurpleVerso:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/sweatPurpleVerso/1794331845632-vm58pk-sweatPurpleVerso.webp",
  teeWhiteRecto: "/dingry/atelier/tee-white-recto-preview.jpg",
  teeWhiteVerso:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/teeWhiteVerso/1794331782351-od10b6-teeWhiteVerso.webp",
  teeBlackRecto: "/dingry/atelier/tee-black-recto-preview.jpg",
  teeBlackVerso:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/teeBlackVerso/1794331778974-wzglyv-teeBlackVerso.webp",
  customConfiguratorBanner:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/customConfiguratorBanner/1794331850163-emon5w-customConfiguratorBanner.webp",
  jerseyWhite:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/jerseyWhite/1794331846811-i910xl-jerseyWhite.webp",
  jerseyBlack:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/jerseyBlack/1794331848996-kh07hn-jerseyBlack.webp",
  hoodieZipOutlineRecto:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/hoodieZipOutlineRecto/1794331875451-l79oku-hoodieZipOutlineRecto.webp",
  hoodieZipOutlineVerso:
    "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/hoodieZipOutlineVerso/1794331905079-rcoe6f-hoodieZipOutlineVerso.webp",
} as const;

/** Images catalogue de repli (flip verso / fiche CRM incomplète). */
export const CATALOG_CANONICAL_IMAGE_BY_ID: Readonly<Record<number, string>> = {
  4: DINGRY_PRODUCT_MEDIA.hoodieZipOutlineRecto,
  5: DINGRY_PRODUCT_MEDIA.hoodieZipOutlineVerso,
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

/** Paires Sweats (col rond) — visuels legacy R2. */
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

export const DINGRY_TEE_PRODUCT_IDS = new Set<number>([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 24,
]);

export const DINGRY_JERSEY_PRODUCT_IDS = new Set<number>([41, 42]);
