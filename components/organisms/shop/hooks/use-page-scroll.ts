"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { readPersistedShopScroll, writePersistedShopScroll } from "@/lib/shop-scroll-persist";

/** Conteneur de scroll de la page + défilement vers une section + persistance sessionStorage. */
export function usePageScroll() {
  const pageScrollRef = useRef<HTMLDivElement>(null);
  const hasRestoredRef = useRef(false);

  const scrollToSection = useCallback((id: string) => {
    requestAnimationFrame(() => {
      const scroller = pageScrollRef.current;
      const target = document.getElementById(id);
      if (!scroller || !target) return;
      const top =
        target.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top +
        scroller.scrollTop;
      const shopRoot = scroller.closest(".dingry-shop");
      const vars = shopRoot ? getComputedStyle(shopRoot) : getComputedStyle(document.documentElement);
      const navH = parseFloat(vars.getPropertyValue("--dingry-nav-h")) || 0;
      const barH = parseFloat(vars.getPropertyValue("--dingry-catalog-bar-h")) || 0;
      const scrollMarginTop =
        parseFloat(window.getComputedStyle(target).scrollMarginTop) || navH + barH + 12;
      scroller.scrollTo({ top: Math.max(0, top - scrollMarginTop), behavior: "smooth" });
    });
  }, []);

  const persistScrollPosition = useCallback(() => {
    const scroller = pageScrollRef.current;
    if (!scroller) return;
    writePersistedShopScroll(scroller.scrollTop);
  }, []);

  const restoreScrollPosition = useCallback(() => {
    if (hasRestoredRef.current) return;
    const saved = readPersistedShopScroll();
    if (saved === null) return;
    const scroller = pageScrollRef.current;
    if (!scroller) return;
    hasRestoredRef.current = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scroller.scrollTo({ top: saved, left: 0, behavior: "auto" });
      });
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useEffect(() => {
    const scroller = pageScrollRef.current;
    if (!scroller) return;

    let rafId = 0;
    let lastWriteAt = 0;
    const onScroll = () => {
      if (rafId !== 0) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        const now = performance.now();
        if (now - lastWriteAt < 400) return;
        lastWriteAt = now;
        writePersistedShopScroll(scroller.scrollTop);
      });
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    const onLeave = () => persistScrollPosition();
    window.addEventListener("beforeunload", onLeave);
    window.addEventListener("pagehide", onLeave);

    return () => {
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeunload", onLeave);
      window.removeEventListener("pagehide", onLeave);
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
    };
  }, [persistScrollPosition]);

  return {
    pageScrollRef,
    scrollToSection,
    restoreScrollPosition,
    persistScrollPosition,
  } satisfies {
    pageScrollRef: RefObject<HTMLDivElement | null>;
    scrollToSection: (id: string) => void;
    restoreScrollPosition: () => void;
    persistScrollPosition: () => void;
  };
}
