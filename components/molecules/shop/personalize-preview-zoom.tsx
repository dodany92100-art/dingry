"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import type { AtelierCustomModel } from "@/lib/atelier-custom-config";
import { atelierVersoPreviewUrl } from "@/lib/atelier-preview-urls";
import { PersonalizePreviewStage } from "./personalize-preview-stage";
import styles from "./personalize-preview-zoom.module.css";

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;

type PersonalizePreviewZoomProps = {
  open: boolean;
  onClose: () => void;
  model: AtelierCustomModel;
  previewLabel: string;
  previewCityTop: string;
  previewCitySize: string;
  cityClassName: string;
  cityStyle: CSSProperties;
};

export function PersonalizePreviewZoom({
  open,
  onClose,
  model,
  previewLabel,
  previewCityTop,
  previewCitySize,
  cityClassName,
  cityStyle,
}: PersonalizePreviewZoomProps) {
  const [mounted, setMounted] = useState(false);
  const [side, setSide] = useState<"recto" | "verso">("recto");
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const pinchRef = useRef<{ distance: number; scale: number } | null>(null);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const versoUrl = atelierVersoPreviewUrl(model.id);
  const showSideToggle = Boolean(versoUrl);
  const imageUrl =
    side === "verso" && versoUrl ? versoUrl : model.previewImageUrl;
  const sideLabel = side === "verso" ? "Vue verso" : "Vue recto — sous le logo";

  const resetView = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setSide("recto");
    resetView();
  }, [open, model.id, resetView]);

  useEffect(() => {
    resetView();
  }, [side, resetView]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const clampScale = (value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

  const zoomIn = () => setScale((prev) => clampScale(prev + SCALE_STEP));
  const zoomOut = () => {
    setScale((prev) => {
      const next = clampScale(prev - SCALE_STEP);
      if (next <= MIN_SCALE) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const onWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
    setScale((prev) => {
      const next = clampScale(prev + delta);
      if (next <= MIN_SCALE) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const el = event.currentTarget;
    el.setPointerCapture(event.pointerId);
    if (scale > MIN_SCALE) {
      dragRef.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
      setPanning(true);
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current && scale > MIN_SCALE) {
      const dx = event.clientX - dragRef.current.x;
      const dy = event.clientY - dragRef.current.y;
      setPan({ x: dragRef.current.panX + dx, y: dragRef.current.panY + dy });
      return;
    }
    if (pinchRef.current && event.pointerType === "touch") {
      return;
    }
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    pinchRef.current = null;
    setPanning(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const onTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2) return;
    const [a, b] = [event.touches[0]!, event.touches[1]!];
    const distance = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
    pinchRef.current = { distance, scale };
    dragRef.current = null;
  };

  const onTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2 || !pinchRef.current) return;
    event.preventDefault();
    const [a, b] = [event.touches[0]!, event.touches[1]!];
    const distance = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
    const ratio = distance / pinchRef.current.distance;
    const next = clampScale(pinchRef.current.scale * ratio);
    setScale(next);
    if (next <= MIN_SCALE) setPan({ x: 0, y: 0 });
  };

  const onTouchEnd = () => {
    pinchRef.current = null;
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className={styles.root}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu agrandi"
          onClick={onClose}
        >
          <div className={styles.toolbar}>
            {showSideToggle ? (
              <div className={styles.sideToggle} onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className={`${styles.sideBtn} ${side === "recto" ? styles.sideBtnOn : ""}`}
                  onClick={() => setSide("recto")}
                >
                  Recto
                </button>
                <button
                  type="button"
                  className={`${styles.sideBtn} ${side === "verso" ? styles.sideBtnOn : ""}`}
                  onClick={() => setSide("verso")}
                >
                  Verso
                </button>
              </div>
            ) : (
              <span />
            )}
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fermer l’aperçu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div
            className={`${styles.viewport} ${panning ? styles.viewportPanning : ""}`}
            onClick={(e) => e.stopPropagation()}
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div
              className={styles.viewportInner}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              }}
            >
              <div className={styles.stageWrap}>
                <PersonalizePreviewStage
                  model={model}
                  imageUrl={imageUrl}
                  previewLabel={previewLabel}
                  previewCityTop={previewCityTop}
                  previewCitySize={previewCitySize}
                  cityClassName={cityClassName}
                  cityStyle={cityStyle}
                  sideLabel={sideLabel}
                  showCityOverlay={side === "recto"}
                />
              </div>
            </div>
          </div>

          <div className={styles.zoomHud} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.zoomBtn} onClick={zoomOut} disabled={scale <= MIN_SCALE} aria-label="Zoom arrière">
              −
            </button>
            <span className={styles.zoomLevel}>{Math.round(scale * 100)}%</span>
            <button type="button" className={styles.zoomBtn} onClick={zoomIn} disabled={scale >= MAX_SCALE} aria-label="Zoom avant">
              +
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
