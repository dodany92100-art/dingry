"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Pencil } from "lucide-react";
import type { Brand } from "@/lib/admin/types";
import { ADMIN_STOREFRONT_PENCIL_BTN_CLASS } from "@/components/molecules/shop/admin-storefront-copy-panel";
import { EDITORIAL_HERITAGE_BANNERS, type EditorialHeritageBannerDefinition } from "@/lib/editorial-sections";
import {
  DEFAULT_EDITORIAL_BANNER_FOCUS,
  clampEditorialBannerFocus,
  editorialBannerObjectPosition,
  type EditorialBannerFocus,
} from "@/lib/editorial-banner-focus";
import { useTranslation } from "@/hooks/use-translation";
import styles from "./brand-heritage-banners.module.css";

const FOCUS_DRAG_SENSITIVITY = 0.12;
const FOCUS_SAVE_DEBOUNCE_MS = 400;

type BrandHeritageBannersProps = {
  onDiscoverBrand: (brand: Brand) => void;
  /** Glisser le visuel pour cadrer (session admin uniquement). */
  adminAdjust?: boolean;
};

function HeritageBannerCard({
  def,
  onDiscoverBrand,
  adminAdjust,
}: {
  def: EditorialHeritageBannerDefinition;
  onDiscoverBrand: (brand: Brand) => void;
  adminAdjust: boolean;
}) {
  const { t } = useTranslation();
  const prefix = `editorialBanners.${def.i18nKey}`;
  const [src, setSrc] = useState(def.backgroundSrc);
  const [focus, setFocus] = useState<EditorialBannerFocus>(() => ({
    ...DEFAULT_EDITORIAL_BANNER_FOCUS[def.id],
  }));
  const [focusEditorOpen, setFocusEditorOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [focusStatus, setFocusStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const dragRef = useRef<{ x: number; y: number; focus: EditorialBannerFocus } | null>(null);
  const focusTouchedRef = useRef(false);
  const latestFocusRef = useRef(focus);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragTargetRef = useRef<HTMLDivElement>(null);
  const framingActive = adminAdjust && focusEditorOpen;
  const title = t(`${prefix}.title`);
  const titleLines = title.includes("\n") ? title.split("\n") : [title];
  const isLeftPane = def.mediaLayout === "leftPane";
  const veilClass = isLeftPane
    ? styles.previewVeilLeftPane
    : def.i18nKey === "rockTheStreet"
      ? styles.previewVeilRts
      : styles.previewVeil;
  const mediaClass = [
    styles.previewMedia,
    def.mediaFit === "contain" ? styles.previewMediaContain : undefined,
    isLeftPane ? styles.previewMediaLeftPane : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  const objectPosition = editorialBannerObjectPosition(focus);

  useEffect(() => {
    latestFocusRef.current = focus;
  }, [focus]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/shop/editorial-banner-focus")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Partial<Record<string, EditorialBannerFocus>> | null) => {
        if (cancelled || !data || focusTouchedRef.current) return;
        const saved = data[def.id];
        if (saved && typeof saved.x === "number" && typeof saved.y === "number") {
          setFocus({
            x: clampEditorialBannerFocus(saved.x),
            y: clampEditorialBannerFocus(saved.y),
          });
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [def.id]);

  const saveFocus = useCallback(
    (next: EditorialBannerFocus) => {
      if (!adminAdjust) return;
      latestFocusRef.current = next;
      setFocusStatus("saving");
      void fetch("/api/admin/shop/editorial-banner-focus", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ banner: def.id, x: next.x, y: next.y }),
      })
        .then((response) => {
          if (!response.ok) {
            setFocusStatus("error");
            return;
          }
          setFocusStatus("saved");
        })
        .catch(() => setFocusStatus("error"));
    },
    [adminAdjust, def.id],
  );

  const scheduleSaveFocus = useCallback(
    (next: EditorialBannerFocus) => {
      latestFocusRef.current = next;
      if (!adminAdjust) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null;
        saveFocus(next);
      }, FOCUS_SAVE_DEBOUNCE_MS);
    },
    [adminAdjust, saveFocus],
  );

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    [],
  );

  const onImgError = useCallback(() => {
    if (src !== def.backgroundFallback) setSrc(def.backgroundFallback);
  }, [def.backgroundFallback, src]);

  const onCta = useCallback(() => {
    onDiscoverBrand(def.brand);
  }, [def.brand, onDiscoverBrand]);

  const onDragPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!framingActive || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = { x: event.clientX, y: event.clientY, focus: { ...latestFocusRef.current } };
      setDragging(true);
    },
    [framingActive],
  );

  useEffect(() => {
    if (!dragging) return;

    const onWindowMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const deltaX = event.clientX - drag.x;
      const deltaY = event.clientY - drag.y;
      focusTouchedRef.current = true;
      const next = {
        x: clampEditorialBannerFocus(drag.focus.x - deltaX * FOCUS_DRAG_SENSITIVITY),
        y: clampEditorialBannerFocus(drag.focus.y - deltaY * FOCUS_DRAG_SENSITIVITY),
      };
      latestFocusRef.current = next;
      setFocus(next);
      scheduleSaveFocus(next);
    };

    const onWindowUp = (event: PointerEvent) => {
      const hadDrag = Boolean(dragRef.current);
      dragRef.current = null;
      setDragging(false);
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      if (dragTargetRef.current?.hasPointerCapture(event.pointerId)) {
        dragTargetRef.current.releasePointerCapture(event.pointerId);
      }
      if (hadDrag && adminAdjust) {
        saveFocus(latestFocusRef.current);
      }
    };

    window.addEventListener("pointermove", onWindowMove);
    window.addEventListener("pointerup", onWindowUp);
    window.addEventListener("pointercancel", onWindowUp);
    return () => {
      window.removeEventListener("pointermove", onWindowMove);
      window.removeEventListener("pointerup", onWindowUp);
      window.removeEventListener("pointercancel", onWindowUp);
    };
  }, [adminAdjust, dragging, saveFocus, scheduleSaveFocus]);

  return (
    <div>
      <div className={styles.bannerHead}>
        <p className="dingry-section-eyebrow m-0">{t(`editorialBanners.${def.i18nKey}.sectionEyebrow`)}</p>
        {adminAdjust ? (
          <button
            type="button"
            className={ADMIN_STOREFRONT_PENCIL_BTN_CLASS}
            aria-label={t("editorialBanners.adminFrameAria", {
              brand: t(`editorialBanners.${def.i18nKey}.sectionEyebrow`),
            })}
            aria-pressed={focusEditorOpen}
            onClick={() => setFocusEditorOpen((open) => !open)}
          >
            <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </button>
        ) : null}
      </div>

      {framingActive ? (
        <p className={styles.focusHint}>
          {t("editorialBanners.adminDragHint")} ({focus.x}% · {focus.y}%)
          {focusStatus === "saving"
            ? " · Enregistrement…"
            : focusStatus === "saved"
              ? " · Enregistré"
              : focusStatus === "error"
                ? " · Erreur"
                : null}
        </p>
      ) : null}

      <article
        className={`${styles.previewCard ?? ""} ${framingActive ? styles.previewCardFraming ?? "" : ""}`}
        aria-labelledby={`${def.id}-banner-title`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- URLs locales / R2 */}
        <img
          src={src}
          alt=""
          aria-hidden
          className={mediaClass}
          style={{ objectPosition }}
          loading="lazy"
          decoding="async"
          onError={onImgError}
        />
        <div className={`${veilClass ?? ""} ${framingActive ? styles.previewVeilFraming ?? "" : ""}`} aria-hidden />
        {framingActive ? (
          <>
            <span
              className={styles.focusMarker}
              style={{ left: `${focus.x}%`, top: `${focus.y}%` }}
              aria-hidden
            />
            <div
              ref={dragTargetRef}
              role="presentation"
              className={`${styles.mediaDragTargetFull ?? ""} ${dragging ? styles.mediaDragTargetActive ?? "" : ""}`}
              onPointerDown={onDragPointerDown}
              aria-hidden
            />
          </>
        ) : null}
        {def.logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={def.logoSrc} alt="" className={styles.logoOverlay ?? ""} decoding="async" aria-hidden />
        ) : null}
        {def.leadOnRightColumn && def.hideLeftTitle && !def.titleOnRightColumn ? (
          <h2 id={`${def.id}-banner-title`} className={styles.srOnly}>
            {title}
          </h2>
        ) : null}
        <div
          className={[
            styles.previewGrid,
            def.leadOnRightColumn ? styles.previewGridSingleRight : undefined,
            framingActive ? styles.previewGridFraming : undefined,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {!def.leadOnRightColumn ? (
            <div className={styles.previewCol}>
              <h2 id={`${def.id}-banner-title`} className={styles.previewTitle}>
                {titleLines[0]}
                {titleLines.length > 1 ? (
                  <>
                    <br />
                    {titleLines.slice(1).join(" ")}
                  </>
                ) : null}
              </h2>
              <p className={styles.previewLead}>{t(`${prefix}.lead`)}</p>
              {def.i18nKey === "rockTheStreet" ? (
                <p className={styles.previewHook}>{t(`${prefix}.hookLeft`)}</p>
              ) : null}
            </div>
          ) : null}

          <div className={styles.previewCol}>
            {def.leadOnRightColumn && def.titleOnRightColumn ? (
              <h2 id={`${def.id}-banner-title`} className={styles.previewTitle}>
                {titleLines[0]}
                {titleLines.length > 1 ? (
                  <>
                    <br />
                    {titleLines.slice(1).join(" ")}
                  </>
                ) : null}
              </h2>
            ) : null}
            {def.leadOnRightColumn ? <p className={styles.previewLead}>{t(`${prefix}.lead`)}</p> : null}
            <p className={styles.previewKicker}>{t(`${prefix}.kickerRight`)}</p>
            <p className={styles.previewHook}>{t(`${prefix}.bodyRight`)}</p>
            <div className={styles.ctaRow}>
              <button type="button" className={`${styles.ctaBtn ?? ""} dingry-interactive-luxe`} onClick={onCta}>
                <span className="gold-text">{t("editorialBanners.discoverCta")}</span>
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

/** Trois bandeaux éditoriaux marque (gabarit Origines) — vitrine uniquement. */
export function BrandHeritageBanners({ onDiscoverBrand, adminAdjust = false }: BrandHeritageBannersProps) {
  const { t } = useTranslation();

  return (
    <section
      id="editorial-banners"
      className="dingry-editorial-banners-band dingry-gold-rule-top relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-[100vw] overflow-x-clip py-10 md:py-14"
      aria-label={t("editorialBanners.sectionAria")}
    >
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
      <div className={styles.stack}>
        {EDITORIAL_HERITAGE_BANNERS.map((def) => (
          <HeritageBannerCard key={def.id} def={def} onDiscoverBrand={onDiscoverBrand} adminAdjust={adminAdjust} />
        ))}
      </div>
      </div>
    </section>
  );
}