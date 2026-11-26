"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DingryProductImage } from "@/components/atoms/dingry-product-image";
import {
  getShopOverlayFocusableElements,
  resolveShopOverlayTabFocus,
  shouldTrapShopOverlayTab,
} from "@/components/organisms/shop/shop-overlay-focus-trap";
import styles from "./pdp-image-zoom.module.css";

type PdpImageZoomProps = {
  open: boolean;
  src: string;
  alt: string;
  onClose: () => void;
};

export function PdpImageZoom({ open, src, alt, onClose }: PdpImageZoomProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const raf = window.requestAnimationFrame(() => closeRef.current?.focus());

    const panel = panelRef.current;
    if (!panel) {
      return () => {
        window.cancelAnimationFrame(raf);
        if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
      };
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const direction = event.shiftKey ? "prev" : "next";
      const focusables = getShopOverlayFocusableElements(panel);
      const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (!shouldTrapShopOverlayTab(direction, focusables, active)) return;
      const target = resolveShopOverlayTabFocus(direction, focusables, active);
      if (!target) return;
      event.preventDefault();
      target.focus();
    };

    panel.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(raf);
      panel.removeEventListener("keydown", onKeyDown);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className={styles.root} role="presentation">
      <button type="button" className={styles.backdrop} aria-label="Fermer le zoom" onClick={onClose} />
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={`Agrandissement — ${alt}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="Fermer">
          ×
        </button>
        <DingryProductImage
          src={src}
          alt={alt}
          width={1200}
          height={1600}
          deliveryWidth={1440}
          priority
          className={styles.image}
          sizes="100vw"
          fitContent
        />
      </div>
    </div>,
    document.body,
  );
}