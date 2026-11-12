import enBase from "@/locales/en.json";
import enShop from "@/locales/en-shop.json";
import frBase from "@/locales/fr.json";
import frShop from "@/locales/fr-shop.json";
import enHeritage from "@/locales/en-heritage.json";
import { buildFrHeritageBundle } from "@/lib/i18n/heritage-fr-legacy";

export const frMerged = {
  ...frBase,
  ...frShop,
  heritage: buildFrHeritageBundle(),
};

export const enMerged = {
  ...enBase,
  ...enShop,
  heritage: enHeritage,
};

export type Messages = typeof frMerged;

export const messages = {
  fr: frMerged,
  en: enMerged,
} as const;
