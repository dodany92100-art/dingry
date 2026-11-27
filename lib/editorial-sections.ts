import type { Brand } from "@/lib/admin/types";
import { DINGRY_EDITORIAL_IMAGE_URL, DINGRY_TEASING_HERO_SRC } from "@/lib/dingry-brand";

/** Visuels bandeaux vitrine (v1 local → R2 homonymes plus tard). */
export const EDITORIAL_BANNER_ASSETS = {
  dingry: "/dingry/editorial/dingry-attitude.jpg",
  rockTheStreet: "/dingry/editorial/rock-the-street-symbol.jpg",
  fyma: "/dingry/editorial/fyma-mon-amour.jpg",
} as const;

export type EditorialBannerId = "dingry" | "rockTheStreet" | "fyma";

export type EditorialHeritageBannerDefinition = {
  id: EditorialBannerId;
  brand: Brand;
  /** Clé i18n racine `editorialBanners.{i18nKey}.*` */
  i18nKey: EditorialBannerId;
  backgroundSrc: string;
  backgroundFallback: string;
  /** `contain` pour visuels déjà sur fond noir (ex. symbole RTS). */
  mediaFit?: "cover" | "contain";
  /** Photo dans le panneau gauche — texte éditorial à droite sur noir. */
  mediaLayout?: "full" | "leftPane";
  /** Wordmark superposé (DINGRY). */
  logoSrc?: string;
  /** Titre déjà dans le visuel — colonne gauche sans h2 visible. */
  hideLeftTitle?: boolean;
  /** Accroche (lead) dans la colonne de droite, sur le noir. */
  leadOnRightColumn?: boolean;
  /** Titre visible en tête du bloc droit (si `hideLeftTitle`). */
  titleOnRightColumn?: boolean;
};

export const EDITORIAL_HERITAGE_BANNERS: readonly EditorialHeritageBannerDefinition[] = [
  {
    id: "dingry",
    i18nKey: "dingry",
    brand: "DINGRY",
    backgroundSrc: EDITORIAL_BANNER_ASSETS.dingry,
    backgroundFallback: DINGRY_TEASING_HERO_SRC,
    mediaLayout: "leftPane",
    hideLeftTitle: true,
    leadOnRightColumn: true,
  },
  {
    id: "rockTheStreet",
    i18nKey: "rockTheStreet",
    brand: "ROCK THE STREET",
    backgroundSrc: EDITORIAL_BANNER_ASSETS.rockTheStreet,
    backgroundFallback: DINGRY_EDITORIAL_IMAGE_URL,
    mediaFit: "contain",
  },
  {
    id: "fyma",
    i18nKey: "fyma",
    brand: "FYMA",
    backgroundSrc: EDITORIAL_BANNER_ASSETS.fyma,
    backgroundFallback: DINGRY_TEASING_HERO_SRC,
    mediaLayout: "leftPane",
    hideLeftTitle: true,
    leadOnRightColumn: true,
    titleOnRightColumn: true,
  },
] as const;