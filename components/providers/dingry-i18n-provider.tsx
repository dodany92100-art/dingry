"use client";

import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DINGRY_LOCALE_STORAGE_KEY,
  messages,
  readStoredLocale,
  translate,
  translateList,
  type Locale,
} from "@/lib/i18n/messages";
import { CATALOG_MENU_TAB_CUSTOM } from "@/lib/catalog-category";
import type { Messages } from "@/lib/i18n/merge-messages";

export type TranslationContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  tList: (key: string) => readonly string[];
  catalogTabLabel: (tab: string) => string;
  dict: Messages;
};

const TranslationContext = createContext<TranslationContextValue | null>(null);

function defaultLocale(): Locale {
  return readStoredLocale() ?? "fr";
}

export function DingryI18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(DINGRY_LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const dict = messages[locale];

  const value = useMemo<TranslationContextValue>(() => {
    const t = (key: string, params?: Record<string, string | number>) => translate(dict, key, params);
    const tList = (key: string) => translateList(dict, key);
    const catalogTabLabel = (tab: string): string => {
      if (tab === CATALOG_MENU_TAB_CUSTOM) return dict.catalog.custom;
      const categories = dict.catalog.categories;
      if (tab in categories) {
        return categories[tab as keyof typeof categories];
      }
      return tab;
    };
    return { locale, setLocale, t, tList, catalogTabLabel, dict };
  }, [dict, locale, setLocale]);

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export { TranslationContext };
