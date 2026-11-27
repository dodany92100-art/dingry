"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ShopProduct } from "@/lib/catalog";
import { parseLookbookProductId } from "@/lib/lookbook-product-link";
import {
  collageSlotForIndex,
  isLookbookVideoUrl,
  lookbookStageMinHeightCss,
  partitionLookbookMontage,
} from "@/lib/lookbook-moodboard";
import { useTranslation } from "@/hooks/use-translation";
import { LookbookLightbox } from "@/components/organisms/shop/lookbook-lightbox";
import styles from "./lookbook-catalog-strip.module.css";

export type LookbookSlide = {
  id: string;
  title: string;
  caption: string;
  image: string;
};

type LookbookLoadState = "idle" | "ready" | "error";

type LookbookCatalogStripProps = {
  products?: readonly ShopProduct[];
  onOpenProduct?: (product: ShopProduct) => void;
};

function pieceHoverLabel(
  slide: LookbookSlide,
  product: ShopProduct | null,
  shopTheLook: string,
): string {
  if (product) return shopTheLook;
  const caption = slide.caption.trim();
  if (caption && !/^(product:\s*)?\d+$/i.test(caption)) return caption;
  return slide.title;
}

/** Section lookbook éditorial — moodboard, cadre vidéo 9:16, lightbox. */
export function LookbookCatalogStrip({ products = [], onOpenProduct }: LookbookCatalogStripProps) {
  const { t } = useTranslation();
  const [slides, setSlides] = useState<LookbookSlide[]>([]);
  const [loadState, setLoadState] = useState<LookbookLoadState>("idle");
  const [heroMuted, setHeroMuted] = useState(true);
  const [lightboxSlide, setLightboxSlide] = useState<LookbookSlide | null>(null);
  const heroVideoRef = useRef<HTMLVideoElement>(null);

  const productById = useMemo(() => {
    const map = new Map<number, ShopProduct>();
    for (const product of products) {
      map.set(product.id, product);
    }
    return map;
  }, [products]);

  const resolveProduct = useCallback(
    (slide: LookbookSlide): ShopProduct | null => {
      const id = parseLookbookProductId(slide.caption);
      if (id === null) return null;
      return productById.get(id) ?? null;
    },
    [productById],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/lookbook");
        if (!response.ok) {
          if (!cancelled) setLoadState("error");
          return;
        }
        const data = (await response.json()) as { slides?: LookbookSlide[] };
        if (cancelled) return;
        setSlides(Array.isArray(data.slides) ? data.slides.filter((s) => s.image?.trim()) : []);
        setLoadState("ready");
      } catch {
        if (!cancelled) setLoadState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;
    video.muted = heroMuted;
    if (!heroMuted) {
      void video.play().catch(() => {
        setHeroMuted(true);
      });
    }
  }, [heroMuted]);

  if (loadState === "ready" && slides.length === 0) return null;
  if (loadState === "error") return null;

  const { phoneSlide, collageSlides } = partitionLookbookMontage(slides);
  const phoneIsVideo = phoneSlide ? isLookbookVideoUrl(phoneSlide.image) : false;
  const lightboxSlides = phoneSlide ? [phoneSlide, ...collageSlides] : collageSlides;
  const lightboxProduct = lightboxSlide ? resolveProduct(lightboxSlide) : null;

  return (
    <section
      className={`dingry-lookbook-band dingry-gold-rule-top scroll-mt-28 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-[100vw] overflow-x-clip py-16 md:py-20 ${styles.band}`}
    >
      <div className={styles.shell}>
        <header className={styles.header}>
          <p className={styles.brandMark}>{t("lookbookTeaser.brandLine")}</p>
          <div className={styles.editorialRule} aria-hidden />
          <h2 className={styles.subtitleHeading}>
            <span>{t("lookbookTeaser.titleLine1")}</span>
            <span className={styles.subtitleSep} aria-hidden>
              {" "}
              /{" "}
            </span>
            <span>{t("lookbookTeaser.titleLine2")}</span>
          </h2>
        </header>

        {loadState === "idle" ? (
          <div className={styles.skeletonStage} aria-hidden>
            <div className={styles.skeletonPhone} />
            <div
              className={styles.skeletonTile}
              style={{ top: "10%", left: "34%", width: "22%", aspectRatio: "3/4" }}
            />
            <div
              className={styles.skeletonTile}
              style={{ top: "38%", left: "56%", width: "26%", aspectRatio: "4/3" }}
            />
          </div>
        ) : phoneSlide || collageSlides.length > 0 ? (
          <div
            className={styles.stage}
            style={{ minHeight: lookbookStageMinHeightCss(collageSlides.length, Boolean(phoneSlide)) }}
          >
            {phoneSlide ? (
              <div className={styles.phoneFrame}>
                <div className={styles.phoneInner}>
                  {phoneIsVideo ? (
                    <video
                      ref={heroVideoRef}
                      className={styles.phoneMedia}
                      src={phoneSlide.image}
                      muted
                      playsInline
                      loop
                      autoPlay
                      preload="metadata"
                      aria-label={phoneSlide.title}
                    />
                  ) : (
                    <button
                      type="button"
                      className="block w-full border-0 bg-transparent p-0"
                      onClick={() => setLightboxSlide(phoneSlide)}
                      aria-label={phoneSlide.title}
                    >
                      <img
                        className={styles.phoneMedia}
                        src={phoneSlide.image}
                        alt={phoneSlide.title}
                        loading="eager"
                        decoding="async"
                      />
                    </button>
                  )}
                  {phoneIsVideo ? (
                    <button
                      type="button"
                      className={styles.audioToggle}
                      aria-pressed={!heroMuted}
                      aria-label={
                        heroMuted ? t("lookbookTeaser.unmuteAria") : t("lookbookTeaser.muteAria")
                      }
                      onClick={() => setHeroMuted((muted) => !muted)}
                    >
                      {heroMuted ? (
                        <VolumeX size={15} strokeWidth={1.5} aria-hidden />
                      ) : (
                        <Volume2 size={15} strokeWidth={1.5} aria-hidden />
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {collageSlides.map((slide, index) => {
              const slot = collageSlotForIndex(index, collageSlides.length);
              const isVideo = isLookbookVideoUrl(slide.image);
              const linkedProduct = resolveProduct(slide);
              const hoverLabel = pieceHoverLabel(slide, linkedProduct, t("lookbookTeaser.shopTheLook"));
              return (
                <button
                  key={slide.id}
                  type="button"
                  className={styles.collagePiece}
                  data-aspect={slot.aspect}
                  data-frame={slot.frame}
                  style={{
                    top: slot.top,
                    left: slot.left,
                    width: slot.width,
                    zIndex: slot.zIndex,
                    ["--lookbook-parallax" as string]: `${slot.parallax}px`,
                  }}
                  onClick={() => setLightboxSlide(slide)}
                  aria-label={slide.title}
                >
                  <span className={styles.collageInner}>
                    {isVideo ? (
                      <video
                        className={styles.collageMedia}
                        src={slide.image}
                        muted
                        playsInline
                        loop
                        autoPlay
                        preload="metadata"
                        aria-label={slide.title}
                      />
                    ) : (
                      <img
                        className={styles.collageMedia}
                        src={slide.image}
                        alt=""
                        loading={index < 4 ? "eager" : "lazy"}
                        decoding="async"
                      />
                    )}
                    <span className={styles.pieceTag}>{hoverLabel}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <LookbookLightbox
        open={lightboxSlide !== null}
        slide={lightboxSlide}
        slides={lightboxSlides}
        product={lightboxProduct}
        closeLabel={t("lookbookTeaser.closeLightboxAria")}
        viewProductLabel={t("lookbookTeaser.viewProduct")}
        prevSlideLabel={t("lookbookTeaser.prevSlideAria")}
        nextSlideLabel={t("lookbookTeaser.nextSlideAria")}
        onClose={() => setLightboxSlide(null)}
        onSelectSlide={setLightboxSlide}
        onOpenProduct={onOpenProduct}
      />
    </section>
  );
}