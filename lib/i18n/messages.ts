import { messages as mergedMessages, type Messages } from "@/lib/i18n/merge-messages";

export type Locale = "fr" | "en";

export const DINGRY_LOCALE_STORAGE_KEY = "dingry-locale";

export const DINGRY_LOCALES: readonly Locale[] = ["fr", "en"];

/** Boutique : anglais non prêt en production — masquer le sélecteur EN. */
export const DINGRY_BOUTIQUE_EN_LOCALE_ENABLED = false;

export type { Messages };

export const messages: Record<Locale, Messages> = mergedMessages;

export function isLocale(value: string): value is Locale {
  return value === "fr" || value === "en";
}

export function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DINGRY_LOCALE_STORAGE_KEY);
    return raw && isLocale(raw) ? raw : null;
  } catch {
    return null;
  }
}

type MessageParams = Record<string, string | number>;

function walkMessages(dict: Messages, key: string): string | string[] | undefined {
  const parts = key.split(".");
  let cur: unknown = dict;
  for (const part of parts) {
    if (!cur || typeof cur !== "object" || !(part in cur)) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  if (typeof cur === "string" || Array.isArray(cur)) return cur;
  return undefined;
}

export function formatMessage(template: string, params?: MessageParams): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(params[name] ?? ""));
}

export function translate(messagesForLocale: Messages, key: string, params?: MessageParams): string {
  const value = walkMessages(messagesForLocale, key);
  if (typeof value === "string") return formatMessage(value, params);
  return key;
}

export function translateList(messagesForLocale: Messages, key: string): readonly string[] {
  const value = walkMessages(messagesForLocale, key);
  return Array.isArray(value) ? value : [];
}
