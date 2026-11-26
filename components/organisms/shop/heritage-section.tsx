"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import {
  DINGRY_FAVICON_SRC,
  DINGRY_HERITAGE_EDITORIAL_SRC,
  DINGRY_HERITAGE_FOUNDER_SRC,
  DINGRY_HERITAGE_PHILOSOPHY_COVER_SRC,
} from "@/lib/dingry-brand";
import {
  DINGRY_HERITAGE_CHRONOLOGY,
  DINGRY_ORIGINES_FOUNDER_BODY,
  DINGRY_ORIGINES_FOUNDER_TITLE,
  DINGRY_ORIGINES_PHILOSOPHY_BODY,
  DINGRY_ORIGINES_PHILOSOPHY_TITLE,
} from "@/lib/dingry-heritage-content";
import { useTranslation } from "@/hooks/use-translation";
import { useShopStorefrontCopy } from "@/hooks/shop-storefront-copy-context";
import { AdminStorefrontCopyTrigger } from "@/components/molecules/shop/admin-storefront-copy-panel";
import {
  clampOriginesPreviewFocusY,
  clampOriginesPreviewOpacity,
  DEFAULT_ORIGINES_PREVIEW_FOCUS_Y,
  DEFAULT_ORIGINES_PREVIEW_OPACITY,
  originesPreviewObjectPosition,
} from "@/lib/origines-preview-focus";
import styles from "./heritage-section.module.css";

function scrollToOriginesBlockFallback(targetId: string) {
  const scroller = document.querySelector<HTMLElement>(".dingry-page");
  const target = document.getElementById(targetId);
  if (!scroller || !target) return;

  const shopRoot = scroller.closest(".dingry-shop");
  const vars = shopRoot ? getComputedStyle(shopRoot) : getComputedStyle(document.documentElement);
  const navH = parseFloat(vars.getPropertyValue("--dingry-nav-h")) || 0;
  const barH = parseFloat(vars.getPropertyValue("--dingry-catalog-bar-h")) || 0;
  const scrollMarginTop =
    parseFloat(window.getComputedStyle(target).scrollMarginTop) || navH + barH + 12;
  const top =
    target.getBoundingClientRect().top -
    scroller.getBoundingClientRect().top +
    scroller.scrollTop -
    scrollMarginTop;

  scroller.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

function scrollToBlockAfterLayout(scrollToBlock: (targetId: string) => void, targetId: string) {
  let attempts = 0;
  let cancelled = false;

  const tryScroll = () => {
    if (cancelled) return;
    const target = document.getElementById(targetId);
    if (target) {
      scrollToBlock(targetId);
      return;
    }
    attempts += 1;
    if (attempts < 12) requestAnimationFrame(tryScroll);
  };

  requestAnimationFrame(() => requestAnimationFrame(tryScroll));

  return () => {
    cancelled = true;
  };
}

type HeritageSectionProps = {
  scrollToBlock?: (targetId: string) => void;
  /** Curseur de cadrage, réservé à la session admin. */
  adminAdjust?: boolean;
};

export function HeritageSection({
  scrollToBlock = scrollToOriginesBlockFallback,
  adminAdjust = false,
}: HeritageSectionProps) {
  const { t, dict } = useTranslation();
  const chronology =
    dict.heritage.chronology.length > 0 ? dict.heritage.chronology : DINGRY_HERITAGE_CHRONOLOGY;
  const { copy } = useShopStorefrontCopy();
  const preview = copy.heritagePreview;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [focusY, setFocusY] = useState(DEFAULT_ORIGINES_PREVIEW_FOCUS_Y);
  const [opacity, setOpacity] = useState(DEFAULT_ORIGINES_PREVIEW_OPACITY);
  const [focusStatus, setFocusStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [focusDirty, setFocusDirty] = useState(false);
  const [focusEditorOpen, setFocusEditorOpen] = useState(false);
  const scrollAfterOpenRef = useRef<string | null>(null);
  const adjustRef = useRef({ y: DEFAULT_ORIGINES_PREVIEW_FOCUS_Y, opacity: DEFAULT_ORIGINES_PREVIEW_OPACITY });
  const focusTouchedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/shop/origines-focus")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { y?: unknown; opacity?: unknown } | null) => {
        if (cancelled || !data || focusTouchedRef.current) return;
        if (typeof data.y === "number") {
          const y = clampOriginesPreviewFocusY(data.y);
          adjustRef.current.y = y;
          setFocusY(y);
        }
        if (typeof data.opacity === "number") {
          const nextOpacity = clampOriginesPreviewOpacity(data.opacity);
          adjustRef.current.opacity = nextOpacity;
          setOpacity(nextOpacity);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  function saveOriginesAdjust() {
    if (!adminAdjust || focusStatus === "saving") return;
    setFocusStatus("saving");
    void fetch("/api/admin/shop/origines-focus", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(adjustRef.current),
    })
      .then((response) => {
        if (!response.ok) {
          setFocusStatus("error");
          return;
        }
        setFocusDirty(false);
        setFocusStatus("saved");
        setFocusEditorOpen(false);
      })
      .catch(() => setFocusStatus("error"));
  }

  function updateFocusY(next: number) {
    const y = clampOriginesPreviewFocusY(next);
    focusTouchedRef.current = true;
    adjustRef.current.y = y;
    setFocusY(y);
    setFocusDirty(true);
    setFocusStatus("idle");
  }

  function updateOpacity(next: number) {
    const nextOpacity = clampOriginesPreviewOpacity(next);
    focusTouchedRef.current = true;
    adjustRef.current.opacity = nextOpacity;
    setOpacity(nextOpacity);
    setFocusDirty(true);
    setFocusStatus("idle");
  }

  useEffect(() => {
    if (!detailsOpen) return;
    const targetId = scrollAfterOpenRef.current;
    if (!targetId) return;

    const cancelScroll = scrollToBlockAfterLayout((id) => {
      scrollAfterOpenRef.current = null;
      scrollToBlock(id);
    }, targetId);

    return cancelScroll;
  }, [detailsOpen, scrollToBlock]);

  function revealDetailsAndScroll(targetId: string) {
    if (detailsOpen) {
      scrollToBlock(targetId);
      return;
    }
    scrollAfterOpenRef.current = targetId;
    setDetailsOpen(true);
  }

  function closeDetails() {
    scrollAfterOpenRef.current = null;
    setDetailsOpen(false);
    scrollToBlock("heritage");
  }

  return (
    <section className="dingry-heritage-band dingry-below-hero-surface dingry-gold-rule-top -mx-4 bg-[#050505] px-4 py-10 sm:-mx-6 sm:px-6 md:py-14 lg:-mx-8 lg:px-8">
      <div className="mb-4 flex items-center justify-between gap-3 md:mb-5">
        <p className="dingry-section-eyebrow m-0">{t("heritageTeaser.eyebrow")}</p>
        <div className="flex shrink-0 items-center gap-1">
          <AdminStorefrontCopyTrigger mode="heritage" ariaLabel="Modifier les textes Origines" />
          {adminAdjust && !focusEditorOpen ? (
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-[#c9a227]"
              aria-label="Régler le visuel Origines"
              onClick={() => setFocusEditorOpen(true)}
            >
              <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      {adminAdjust && focusEditorOpen ? (
        <div className={styles.focusControls}>
          <label className={styles.focusControl}>
            <span>Cadrage du visuel · {focusY}</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={focusY}
              aria-label="Cadrage vertical du visuel Origines"
              className="dingry-footer-shift-range"
              onChange={(event) => updateFocusY(Number(event.target.value))}
            />
          </label>
          <label className={styles.focusControl}>
            <span>Opacité du visuel · {opacity}</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={opacity}
              aria-label="Opacité du visuel Origines"
              className="dingry-footer-shift-range"
              onChange={(event) => updateOpacity(Number(event.target.value))}
            />
          </label>
          <button
            type="button"
            className="h-11 min-w-28 border border-[#c9a227]/70 px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c9a227] disabled:cursor-not-allowed disabled:opacity-40 md:col-span-2 md:justify-self-start"
            disabled={focusStatus === "saving"}
            onClick={() => {
              if (!focusDirty) {
                setFocusEditorOpen(false);
                return;
              }
              saveOriginesAdjust();
            }}
          >
            {focusStatus === "saving"
              ? "Enregistrement"
              : focusDirty
                ? focusStatus === "error"
                  ? "Réessayer"
                  : "Enregistrer"
                : "Fermer"}
          </button>
        </div>
      ) : null}

      <div className={styles.previewCard}>
        <img
          src={DINGRY_HERITAGE_EDITORIAL_SRC}
          alt=""
          aria-hidden
          className={styles.previewMedia}
          style={{
            objectPosition: originesPreviewObjectPosition(focusY),
            filter: `brightness(${(0.35 + 0.65 * (opacity / 100)).toFixed(3)}) saturate(1.05)`,
          }}
        />
        <div className={styles.previewVeil} aria-hidden style={{ opacity: (100 - opacity) / 100 }} />
        <div className={styles.previewGrid}>
          <div className={styles.previewCol}>
            <h2 className={styles.previewTitle}>
              {preview.titleLine1}
              <br />
              {preview.titleLine2}
            </h2>
            <p className={styles.previewLead}>{preview.philosophyLead}</p>
            <p className={styles.previewHook}>{preview.philosophyHook}</p>
          </div>

          <div className={styles.previewDivider} aria-hidden />

          <div className={styles.previewCol}>
            <p className={styles.previewKicker}>{preview.founderKicker}</p>
            <p className={styles.previewHook}>{preview.founderHook}</p>
            <p className={styles.previewHook}>{preview.founderOutro}</p>
            <div className={styles.ctaRow}>
              <button
                type="button"
                className={`${styles.ctaBtn} dingry-interactive-luxe`}
                onClick={() => revealDetailsAndScroll("origines-fondateur")}
              >
                <span className="gold-text">{preview.ctaFounder}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs tracking-[0.12em] text-white/45">{preview.homepageHook}</p>

      {detailsOpen ? (
        <div className={styles.detailExpand}>
          <p className={styles.detailHeritageEyebrow}>{t("heritageTeaser.eyebrow")}</p>
          <div className={styles.detailBlocks}>
            <article id="origines-philosophie" className={styles.detailCard}>
              <figure className={styles.detailVisual}>
                <img
                  src={DINGRY_HERITAGE_PHILOSOPHY_COVER_SRC}
                  alt=""
                  className={styles.detailVisualMedia}
                  loading="lazy"
                />
              </figure>
              <div className={styles.detailCopy}>
                <h3 className={styles.detailHeadline}>{DINGRY_ORIGINES_PHILOSOPHY_TITLE}</h3>
                <p className={styles.detailBody}>{DINGRY_ORIGINES_PHILOSOPHY_BODY}</p>
              </div>
            </article>

            <article id="origines-fondateur" className={styles.detailCard}>
              <figure className={styles.detailVisual}>
                <img
                  src={DINGRY_HERITAGE_FOUNDER_SRC}
                  alt=""
                  className={styles.detailVisualMedia}
                  loading="lazy"
                />
              </figure>
              <div className={styles.detailCopy}>
                <h3 className={styles.detailHeadline}>{DINGRY_ORIGINES_FOUNDER_TITLE}</h3>
                <p className={styles.detailBody}>{DINGRY_ORIGINES_FOUNDER_BODY}</p>
              </div>
            </article>
          </div>

          <section className={styles.detailChronology} aria-labelledby="origines-chronology-title">
            <h2 id="origines-chronology-title" className={styles.detailChronologyTitle}>
              {t("heritageReader.chronologyTitle")}
            </h2>
            <div className={styles.detailChronologyTrack}>
              <div className={styles.detailChronologyLine} aria-hidden />
              <ol className={styles.detailChronologyList}>
                {chronology.map((milestone) => (
                  <li key={milestone.year} className={styles.detailChronologyItem}>
                    <span className={styles.detailChronologyMarker} aria-hidden />
                    <p className={styles.detailChronologyYear}>{milestone.year}</p>
                    <p className={styles.detailChronologyLabel}>{milestone.label}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>
          <div className={styles.detailFooter}>
            <button
              type="button"
              className={`${styles.detailCloseBtn} dingry-interactive-luxe`}
              aria-label={t("heritageTeaser.closeDetailsAria")}
              onClick={closeDetails}
            >
              <img src={DINGRY_FAVICON_SRC} alt="" className={styles.detailCloseMark} aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}