"use client";

import { useContext } from "react";
import {
  TranslationContext,
  type TranslationContextValue,
} from "@/components/providers/dingry-i18n-provider";
import { messages, type Locale } from "@/lib/i18n/messages";
import type { Messages } from "@/lib/i18n/merge-messages";

export type { TranslationContextValue };

export function useTranslation(): TranslationContextValue {
  const ctx = useContext(TranslationContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within DingryI18nProvider");
  }
  return ctx;
}

export function useTranslationOptional(): TranslationContextValue | null {
  return useContext(TranslationContext);
}

export function staticMessages(locale: Locale): Messages {
  return messages[locale];
}

export { DingryI18nProvider } from "@/components/providers/dingry-i18n-provider";
