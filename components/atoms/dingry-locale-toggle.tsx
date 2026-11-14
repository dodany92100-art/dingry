"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { DINGRY_BOUTIQUE_EN_LOCALE_ENABLED, type Locale } from "@/lib/i18n/messages";

type DingryLocaleToggleProps = {
  className?: string;
  variant?: "pill" | "compact";
};

function nextLocale(locale: Locale): Locale {
  return locale === "fr" ? "en" : "fr";
}

export function DingryLocaleToggle({ className, variant = "pill" }: DingryLocaleToggleProps) {
  const { locale, setLocale, t } = useTranslation();
  if (!DINGRY_BOUTIQUE_EN_LOCALE_ENABLED) return null;
  const target = nextLocale(locale);
  const label = target === "fr" ? t("nav.localeFr") : t("nav.localeEn");
  const ariaLabel = target === "en" ? t("nav.switchToEn") : t("nav.switchToFr");

  return (
    <button
      type="button"
      className={cn(
        "dingry-locale-toggle dingry-interactive-luxe inline-flex min-h-10 min-w-[2.5rem] items-center justify-center rounded-full px-2.5 py-1 text-[9px] font-semibold tracking-[0.22em] uppercase text-white/90 transition-colors hover:bg-white/[0.1] hover:text-white",
        variant === "pill" && "border border-white/20 bg-white/[0.06]",
        className,
      )}
      onClick={() => setLocale(target)}
      aria-label={ariaLabel}
    >
      {label}
    </button>
  );
}
