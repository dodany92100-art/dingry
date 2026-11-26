"use client";

import Image from "next/image";
import { Pencil } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import {
  clampShopHeroFocalAxis,
  clampShopHeroScale,
  resolveShopHeroFraming,
  shopHeroFramingStyle,
  SHOP_HERO_FOCAL_AXIS_MAX,
  SHOP_HERO_FOCAL_AXIS_MIN,
  type ShopHeroFramingMap,
  type ShopHeroSlideFraming,
} from "@/lib/shop-hero-framing";
import { resolveShopHeroSlideImageUrl, type ShopHeroMediaMap } from "@/lib/shop-hero-media";
import { DEFAULT_SHOP_HERO_FRAMING_DEFAULTS, SHOP_HERO_SLIDES, type ShopHeroSlide } from "@/lib/shop-hero-slides";
import { useTranslation } from "@/hooks/use-translation";
import styles from "./shop-hero.module.css";

const AUTO_ADVANCE_MS = 7000;

type ShopHeroProps = {
  onDiscoverCollection?: () => void;
  /** Session admin : curseur de cadrage par slide. */
  adminAdjust?: boolean;
};

function slideIndexDelta(delta: number, length: number, current: number): number {
  return (current + delta + length) % length;
}

type LookbookApiSlide = {
  id: string;
  title: string;
  image: string;
};

export function ShopHero({ onDiscoverCollection, adminAdjust = false }: ShopHeroProps) {
  const { t } = useTranslation();
  const [heroSlides, setHeroSlides] = useState<readonly ShopHeroSlide[]>(SHOP_HERO_SLIDES);
  const slideCount = heroSlides.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [framingMap, setFramingMap] = useState<ShopHeroFramingMap>(DEFAULT_SHOP_HERO_FRAMING_DEFAULTS);
  const [framingEditorOpen, setFramingEditorOpen] = useState(false);
  const [draftFraming, setDraftFraming] = useState<ShopHeroSlideFraming | null>(null);
  const [framingDirty, setFramingDirty] = useState(false);
  const [framingStatus, setFramingStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const dragRef = useRef(false);
  const heroRef = useRef<HTMLElement>(null);

  const activeSlide = heroSlides[activeIndex];

  const applyHeroMedia = useCallback((media: ShopHeroMediaMap) => {
    setHeroSlides((current) =>
      current.map((slide) => {
        const src = resolveShopHeroSlideImageUrl(slide.id, slide.src, media);
        return src === slide.src ? slide : { ...slide, src };
      }),
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/shop/hero-framing")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { framing?: ShopHeroFramingMap } | null) => {
        if (cancelled || !data?.framing) return;
        setFramingMap((current) => ({ ...current, ...data.framing }));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/shop/hero-media")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { media?: ShopHeroMediaMap } | null) => {
        if (cancelled || !data?.media) return;
        applyHeroMedia(data.media);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [applyHeroMedia]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/lookbook");
        if (!response.ok) return;
        const data = (await response.json()) as { slides?: LookbookApiSlide[] };
        const first = data.slides?.find((slide) => slide.image?.trim());
        if (!first || cancelled) return;
        setHeroSlides((current) => {
          const next = [...current];
          const lookbookIndex = next.findIndex((slide) => slide.id === "lookbook-hero");
          const targetIndex = lookbookIndex >= 0 ? lookbookIndex : 1;
          const seed = next[targetIndex] ?? SHOP_HERO_SLIDES[1]!;
          const dynamicSrc = first.image;
          next[targetIndex] = {
            id: `lookbook-${first.id}`,
            src: dynamicSrc,
            alt: first.title.trim() || "DINGRY Lookbook",
            imageClassName: "object-cover",
            defaultFraming: seed.defaultFraming,
          };
          return next;
        });
        const mediaRes = await fetch("/api/shop/hero-media");
        if (mediaRes.ok) {
          const payload = (await mediaRes.json()) as { media?: ShopHeroMediaMap };
          if (payload.media && !cancelled) applyHeroMedia(payload.media);
        }
      } catch {
        /* seed lookbook déjà en place */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyHeroMedia]);

  const effectiveFraming = useCallback(
    (slide: ShopHeroSlide): ShopHeroSlideFraming => {
      if (framingEditorOpen && slide.id === activeSlide?.id && draftFraming) {
        return draftFraming;
      }
      return resolveShopHeroFraming(slide.id, slide.defaultFraming, framingMap);
    },
    [activeSlide?.id, draftFraming, framingEditorOpen, framingMap],
  );

  const activeResolvedFraming = useMemo(
    () => (activeSlide ? effectiveFraming(activeSlide) : null),
    [activeSlide, effectiveFraming],
  );

  function openFramingEditor() {
    if (!activeSlide) return;
    setDraftFraming(effectiveFraming(activeSlide));
    setFramingEditorOpen(true);
    setFramingDirty(false);
    setFramingStatus("idle");
    setAutoPlay(false);
  }

  function setFramingFromPointer(event: PointerEvent<HTMLButtonElement>) {
    if (!framingEditorOpen || !activeResolvedFraming) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setDraftFraming({
      focalX: clampShopHeroFocalAxis(x),
      focalY: clampShopHeroFocalAxis(y),
      scale: draftFraming?.scale ?? activeResolvedFraming.scale,
    });
    setFramingDirty(true);
    setFramingStatus("idle");
  }

  function saveFraming() {
    if (!adminAdjust || !activeSlide || !draftFraming || framingStatus === "saving") return;
    setFramingStatus("saving");
    void fetch("/api/admin/shop/hero-framing", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slideId: activeSlide.id, framing: draftFraming }),
    })
      .then((response) => {
        if (!response.ok) {
          setFramingStatus("error");
          return;
        }
        return response.json() as Promise<{ framing?: ShopHeroFramingMap }>;
      })
      .then((payload) => {
        if (!payload?.framing) {
          setFramingStatus("error");
          return;
        }
        setFramingMap(payload.framing);
        setFramingDirty(false);
        setFramingStatus("saved");
        setFramingEditorOpen(false);
        setDraftFraming(null);
      })
      .catch(() => setFramingStatus("error"));
  }

  useEffect(() => {
    if (!framingEditorOpen || !adminAdjust) return;
    const node = heroRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      if (!draftFraming) return;
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.04 : 0.04;
      setDraftFraming((prev) => {
        const base = prev ?? activeResolvedFraming ?? { focalX: 50, focalY: 40, scale: 1 };
        return { ...base, scale: clampShopHeroScale(base.scale + delta) };
      });
      setFramingDirty(true);
      setFramingStatus("idle");
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [activeResolvedFraming, adminAdjust, draftFraming, framingEditorOpen]);

  const goTo = useCallback(
    (index: number) => {
      if (slideCount === 0) return;
      setActiveIndex(((index % slideCount) + slideCount) % slideCount);
    },
    [slideCount],
  );

  const goPrev = useCallback(() => {
    setAutoPlay(false);
    setActiveIndex((current) => slideIndexDelta(-1, slideCount, current));
  }, [slideCount]);

  const goNext = useCallback(() => {
    setAutoPlay(false);
    setActiveIndex((current) => slideIndexDelta(1, slideCount, current));
  }, [slideCount]);

  useEffect(() => {
    if (slideCount <= 1 || !autoPlay) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const id = window.setInterval(() => {
      setActiveIndex((current) => slideIndexDelta(1, slideCount, current));
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(id);
  }, [autoPlay, slideCount]);

  const pauseAuto = useCallback(() => setAutoPlay(false), []);
  const resumeAuto = useCallback(() => {
    if (!framingEditorOpen) setAutoPlay(true);
  }, [framingEditorOpen]);

  return (
    <section
      ref={heroRef}
      className={`dingry-hero ${styles.hero} relative h-[100dvh] w-full shrink-0 overflow-hidden bg-black text-white md:min-h-[700px]`}
      aria-roledescription="carousel"
      aria-label="DINGRY — galerie d’accueil"
      onMouseEnter={pauseAuto}
      onMouseLeave={resumeAuto}
    >
      <div className={styles.stage} aria-live="polite">
        {heroSlides.map((slide, index) => {
          const isActive = index === activeIndex;
          const framing = effectiveFraming(slide);
          const imageStyle = shopHeroFramingStyle(framing);
          return (
            <div
              key={slide.id}
              className={`${styles.slide} ${isActive ? styles.slideActive : ""}`}
              aria-hidden={!isActive}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                priority={index === 0}
                fetchPriority={index === 0 ? "high" : "auto"}
                fill
                sizes="100vw"
                decoding={index === 0 ? "sync" : "async"}
                className={slide.imageClassName}
                style={imageStyle}
              />
              {adminAdjust && framingEditorOpen && isActive ? (
                <span
                  className="pointer-events-none absolute z-[2] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#FF3D00] shadow-[0_0_0_1px_rgb(0_0_0/0.55)]"
                  style={{ left: `${framing.focalX}%`, top: `${framing.focalY}%` }}
                  aria-hidden
                />
              ) : null}
            </div>
          );
        })}
      </div>

      {adminAdjust && framingEditorOpen ? (
        <>
          <button
            type="button"
            className="absolute inset-0 z-[25] cursor-crosshair touch-none"
            aria-label="Cadrer le hero — clic ou glisser, molette pour zoom"
            onPointerDown={(event) => {
              dragRef.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              setFramingFromPointer(event);
            }}
            onPointerMove={(event) => {
              if (!dragRef.current) return;
              setFramingFromPointer(event);
            }}
            onPointerUp={(event) => {
              dragRef.current = false;
              event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            onPointerCancel={() => {
              dragRef.current = false;
            }}
          />
          <div className="pointer-events-auto absolute inset-x-3 top-14 z-[30] max-w-md space-y-3 rounded-lg border border-[#c9a227]/40 bg-black/88 p-4 sm:inset-x-6 sm:top-16">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#c9a227]">
              Cadrage · {activeSlide?.alt ?? "slide"} · clic / glisser · molette = zoom
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[9px] uppercase tracking-[0.14em] text-white/50">
                  Gauche — droite · {draftFraming?.focalX ?? activeResolvedFraming?.focalX ?? 50}%
                </span>
                <input
                  type="range"
                  min={SHOP_HERO_FOCAL_AXIS_MIN}
                  max={SHOP_HERO_FOCAL_AXIS_MAX}
                  value={draftFraming?.focalX ?? activeResolvedFraming?.focalX ?? 50}
                  onChange={(event) => {
                    const focalX = clampShopHeroFocalAxis(Number(event.target.value));
                    setDraftFraming((prev) => ({
                      focalX,
                      focalY: prev?.focalY ?? activeResolvedFraming?.focalY ?? 40,
                      scale: prev?.scale ?? activeResolvedFraming?.scale ?? 1,
                    }));
                    setFramingDirty(true);
                  }}
                  className="w-full accent-[#c9a227]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[9px] uppercase tracking-[0.14em] text-white/50">
                  Haut — bas · {draftFraming?.focalY ?? activeResolvedFraming?.focalY ?? 40}%
                </span>
                <input
                  type="range"
                  min={SHOP_HERO_FOCAL_AXIS_MIN}
                  max={SHOP_HERO_FOCAL_AXIS_MAX}
                  value={draftFraming?.focalY ?? activeResolvedFraming?.focalY ?? 40}
                  onChange={(event) => {
                    const focalY = clampShopHeroFocalAxis(Number(event.target.value));
                    setDraftFraming((prev) => ({
                      focalX: prev?.focalX ?? activeResolvedFraming?.focalX ?? 50,
                      focalY,
                      scale: prev?.scale ?? activeResolvedFraming?.scale ?? 1,
                    }));
                    setFramingDirty(true);
                  }}
                  className="w-full accent-[#c9a227]"
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-[9px] uppercase tracking-[0.14em] text-white/50">
                Zoom · {Math.round((draftFraming?.scale ?? 1) * 100)}%
              </span>
              <input
                type="range"
                min={100}
                max={225}
                value={Math.round((draftFraming?.scale ?? 1) * 100)}
                onChange={(event) => {
                  const scale = clampShopHeroScale(Number(event.target.value) / 100);
                  setDraftFraming((prev) => ({
                    focalX: prev?.focalX ?? activeResolvedFraming?.focalX ?? 50,
                    focalY: prev?.focalY ?? activeResolvedFraming?.focalY ?? 40,
                    scale,
                  }));
                  setFramingDirty(true);
                }}
                className="w-full accent-[#c9a227]"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="h-10 min-w-28 border border-[#c9a227]/70 px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c9a227] disabled:opacity-40"
                disabled={framingStatus === "saving" || !framingDirty}
                onClick={() => saveFraming()}
              >
                {framingStatus === "saving" ? "Enregistrement…" : "Enregistrer"}
              </button>
              <button
                type="button"
                className="h-10 border border-white/20 px-4 text-[10px] uppercase tracking-[0.12em] text-white/70"
                onClick={() => {
                  setFramingEditorOpen(false);
                  setDraftFraming(null);
                  setFramingDirty(false);
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </>
      ) : null}

      {adminAdjust && !framingEditorOpen ? (
        <>
          <button
            type="button"
            className="pointer-events-auto absolute right-3 top-14 z-[30] inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#c9a227]/50 bg-black/70 text-[#c9a227] sm:right-6 sm:top-16"
            aria-label="Régler le cadrage du hero (slide visible)"
            onClick={() => openFramingEditor()}
          >
            <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            className="pointer-events-auto absolute bottom-24 right-3 z-[30] inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#c9a227]/50 bg-black/70 text-[#c9a227] sm:right-6 md:bottom-28"
            aria-label="Régler le cadrage du hero (bas)"
            onClick={() => openFramingEditor()}
          >
            <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </button>
        </>
      ) : null}

      {slideCount > 1 ? (
        <>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.navBtnPrev}`}
            onClick={goPrev}
            aria-label="Image précédente"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden>
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.navBtnNext}`}
            onClick={goNext}
            aria-label="Image suivante"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden>
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className={styles.dots} role="tablist" aria-label="Choisir une image du hero">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Afficher ${slide.alt}`}
                className={`${styles.dot} ${index === activeIndex ? styles.dotActive : ""}`}
                onClick={() => {
                  pauseAuto();
                  goTo(index);
                }}
              />
            ))}
          </div>
        </>
      ) : null}

      {onDiscoverCollection ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center pb-10 md:pb-14">
          <button
            type="button"
            onClick={onDiscoverCollection}
            className="dingry-gold-pill-btn dingry-interactive-luxe pointer-events-auto px-6 py-3 text-[10px] font-semibold tracking-[0.28em] uppercase"
          >
            <span className="gold-text">{t("cart.drawer.discoverCollection")}</span>
          </button>
        </div>
      ) : null}
    </section>
  );
}