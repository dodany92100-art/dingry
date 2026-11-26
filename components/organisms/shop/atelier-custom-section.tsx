"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { Pencil } from "lucide-react";
import type { OpenCustomOptions } from "@/lib/shop/atelier-open-options";
import {
  CATALOG_SECTION_HEADING_CLASS,
  CATALOG_VITRINE_SHELL_CLASS,
  DINGRY_SECTION_SCROLL_OFFSET_CLASS,
} from "@/components/organisms/shop/catalog-layout";
import { bannerObjectPosition } from "@/lib/catalog-perso-banner-focus";
import { resolveAtelierSectionHero, type ShopAtelierCustomConfig } from "@/lib/atelier-custom-config";
import {
  ATELIER_HERO_HARBOR_SHIFT_MAX,
  ATELIER_HERO_HARBOR_SHIFT_MIN,
  clampAtelierHeroHarborShift,
  DEFAULT_ATELIER_HERO_HARBOR_SHIFT,
  normalizeAtelierHeroHarborShift,
  atelierHeroHarborShiftStyle,
  type AtelierHeroHarborShift,
} from "@/lib/atelier-hero-harbor-shift";
import { DINGRY_LOGO_MONDE_CITIES_SRC } from "@/lib/dingry-brand";
import { useTranslation } from "@/hooks/use-translation";

type AtelierCustomSectionProps = {
  config?: ShopAtelierCustomConfig;
  onOpenCustom: (options?: OpenCustomOptions) => void;
  /** Curseurs logo / CTA hero, réservés à la session admin. */
  adminAdjust?: boolean;
};

export function AtelierCustomSection({
  config,
  onOpenCustom,
  adminAdjust = false,
}: AtelierCustomSectionProps) {
  const { t } = useTranslation();
  const [harborShift, setHarborShift] = useState<AtelierHeroHarborShift>(DEFAULT_ATELIER_HERO_HARBOR_SHIFT);
  const [shiftStatus, setShiftStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [shiftDirty, setShiftDirty] = useState(false);
  const [shiftEditorOpen, setShiftEditorOpen] = useState(false);
  const shiftRef = useRef<AtelierHeroHarborShift>(DEFAULT_ATELIER_HERO_HARBOR_SHIFT);
  const shiftTouchedRef = useRef(false);

  useEffect(() => {
    void import("@/components/organisms/shop/personalize-modal");
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/shop/atelier-hero-shift")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Partial<AtelierHeroHarborShift> | null) => {
        if (cancelled || !data || shiftTouchedRef.current) return;
        const next = normalizeAtelierHeroHarborShift(data);
        shiftRef.current = next;
        setHarborShift(next);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  function updateHarborShift(key: keyof AtelierHeroHarborShift, value: number) {
    const next = { ...shiftRef.current, [key]: clampAtelierHeroHarborShift(value) };
    shiftTouchedRef.current = true;
    shiftRef.current = next;
    setHarborShift(next);
    setShiftDirty(true);
    setShiftStatus("idle");
  }

  function saveHarborShift() {
    if (!adminAdjust || shiftStatus === "saving") return;
    setShiftStatus("saving");
    void fetch("/api/admin/shop/atelier-hero-shift", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(shiftRef.current),
    })
      .then((response) => {
        if (!response.ok) {
          setShiftStatus("error");
          return;
        }
        setShiftDirty(false);
        setShiftStatus("saved");
        setShiftEditorOpen(false);
      })
      .catch(() => setShiftStatus("error"));
  }

  const title = t("atelier.sectionTitle");
  const lead = t("atelier.sectionLead");
  const eyebrow = t("atelier.sectionEyebrow");
  const headline = t("atelier.sectionHeadline");
  const body = t("atelier.sectionBody");
  const tagline = t("atelier.sectionTagline");
  const surchargeNote = t("atelier.sectionSurcharge");
  const cta = t("atelier.banner.cta");
  const sectionHero = resolveAtelierSectionHero(config?.sectionHero);

  const harborStyle = atelierHeroHarborShiftStyle(harborShift) as CSSProperties;

  if (config && !config.enabled) return null;

  const shiftSliders = (
    [
      ["logoX", "Logo · gauche / droite"],
      ["logoY", "Logo · haut / bas"],
      ["ctaX", "CUSTOM · gauche / droite"],
      ["ctaY", "CUSTOM · haut / bas"],
    ] as const
  ).map(([key, label]) => (
    <label
      key={key}
      className="grid gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#c9a227]"
    >
      <span>
        {label} · {harborShift[key]}px
      </span>
      <input
        type="range"
        min={ATELIER_HERO_HARBOR_SHIFT_MIN}
        max={ATELIER_HERO_HARBOR_SHIFT_MAX}
        step={1}
        value={harborShift[key]}
        aria-label={label}
        className="dingry-footer-shift-range"
        onChange={(event) => updateHarborShift(key, Number(event.target.value))}
      />
    </label>
  ));

  return (
    <>
      <section
        id="atelier-custom-editorial"
        aria-labelledby="atelier-custom-headline"
        className={`dingry-atelier-editorial dingry-catalog-surface dingry-below-hero-surface dingry-gold-rule-top ${DINGRY_SECTION_SCROLL_OFFSET_CLASS} relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-[100vw] py-8 md:py-10`}
      >
        <div className={`${CATALOG_VITRINE_SHELL_CLASS} space-y-4 md:space-y-5`}>
          <p className="dingry-section-eyebrow dingry-catalog-collection-eyebrow m-0">{eyebrow}</p>
          <h3 id="atelier-custom-headline" className={CATALOG_SECTION_HEADING_CLASS}>
            {headline}
          </h3>
          <div className="dingry-atelier-editorial__copy space-y-3 text-base leading-relaxed md:text-lg">
            <p className="dingry-atelier-editorial__body m-0">{body}</p>
            <p className="dingry-atelier-editorial__tagline m-0 font-semibold md:font-bold">{tagline}</p>
            <p className="dingry-atelier-editorial__surcharge m-0 text-sm font-medium tracking-wide text-[#a88420] md:text-base">
              {surchargeNote}
            </p>
          </div>
        </div>
      </section>
      <section
        id="atelier-custom-hero"
        className="dingry-gold-rule-top dingry-atelier-hero relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-[100vw] overflow-hidden bg-black text-white"
        aria-labelledby="dingry-atelier-hero-title"
        style={harborStyle}
      >
        <div className="dingry-atelier-hero__stage relative flex min-h-[min(100dvh,56rem)] w-full flex-col">
          <AtelierHeroImage
            imageUrl={sectionHero.imageUrl}
            focusX={sectionHero.imageFocusX}
            focusY={sectionHero.imageFocusY}
          />
          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black via-black/55 to-black/25"
            aria-hidden
          />
          {adminAdjust ? (
            shiftEditorOpen ? (
              <div className="pointer-events-auto absolute inset-x-3 top-3 z-[20] grid gap-3 rounded-lg border border-[#c9a227]/40 bg-black/88 p-4 sm:inset-x-6 sm:top-4 md:grid-cols-2 lg:max-w-3xl">
                {shiftSliders}
                <button
                  type="button"
                  className="h-11 min-w-28 border border-[#c9a227]/70 px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c9a227] disabled:cursor-not-allowed disabled:opacity-40 md:col-span-2 md:justify-self-start"
                  disabled={shiftStatus === "saving"}
                  onClick={() => {
                    if (!shiftDirty) {
                      setShiftEditorOpen(false);
                      return;
                    }
                    saveHarborShift();
                  }}
                >
                  {shiftStatus === "saving"
                    ? "Enregistrement"
                    : shiftDirty
                      ? shiftStatus === "error"
                        ? "Réessayer"
                        : "Enregistrer"
                      : "Fermer"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="pointer-events-auto absolute right-3 top-3 z-[20] inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#c9a227]/50 bg-black/70 text-[#c9a227] sm:right-6 sm:top-4"
                aria-label="Régler le logo et le bouton CUSTOM du hero atelier"
                onClick={() => setShiftEditorOpen(true)}
              >
                <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              </button>
            )
          ) : null}
          <div className="dingry-atelier-hero__copy-static pointer-events-none absolute inset-x-0 top-12 z-[2] mx-auto flex w-full max-w-[1400px] flex-col gap-2 px-4 sm:top-14 sm:px-6 md:top-16 md:gap-3">
            <h2
              id="dingry-atelier-hero-title"
              className="dingry-section-eyebrow dingry-atelier-hero__eyebrow gold-text dingry-typo-street m-0"
            >
              {title}
            </h2>
            <p className="max-w-xl text-base text-white/90 md:text-lg">{lead}</p>
          </div>
          <div
            id="dingry-atelier-hero-logo"
            data-dingry-inspect="atelier-hero-logo"
            className="dingry-atelier-hero__logo-block pointer-events-none absolute inset-0 z-[3]"
          >
            <div className="dingry-atelier-hero__mark-wrap dingry-atelier-hero__mark-wrap--harbor pointer-events-auto">
              <Image
                src={DINGRY_LOGO_MONDE_CITIES_SRC}
                alt=""
                aria-hidden
                width={500}
                height={500}
                priority={false}
                draggable={false}
                className="dingry-custom-banner-mark dingry-atelier-hero__mark pointer-events-auto object-contain object-left-bottom"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenCustom()}
            className="dingry-atelier-hero__cta-dock dingry-atelier-hero__cta-dock--harbor dingry-gold-pill-btn pointer-events-auto absolute z-[4] w-fit rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8b96a]"
            aria-label={cta}
          >
            <span className="gold-text">{cta}</span>
          </button>
        </div>
      </section>
    </>
  );
}

function AtelierHeroImage({
  imageUrl,
  focusX,
  focusY,
}: {
  imageUrl: string;
  focusX: number;
  focusY: number;
}) {
  const objectPosition = bannerObjectPosition(focusX, focusY);
  const isLocal = imageUrl.startsWith("/");
  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      {isLocal ? (
        <Image
          src={imageUrl}
          alt=""
          aria-hidden
          priority={false}
          fill
          sizes="100vw"
          loading="lazy"
          className="object-cover opacity-95"
          style={{ objectPosition }}
        />
      ) : (
        <img
          src={imageUrl}
          alt=""
          aria-hidden
          decoding="async"
          loading="lazy"
          className="h-full w-full object-cover opacity-95"
          style={{ objectPosition }}
        />
      )}
    </div>
  );
}