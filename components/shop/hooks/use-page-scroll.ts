"use client";

import { useCallback, useRef } from "react";

/** Conteneur de scroll de la page + défilement vers une section par id. */
export function usePageScroll() {
  const pageScrollRef = useRef<HTMLDivElement>(null);

  const scrollToSection = useCallback((id: string) => {
    const scroller = pageScrollRef.current;
    const target = document.getElementById(id);
    if (!scroller || !target) return;
    const top =
      target.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top +
      scroller.scrollTop;
    scroller.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, []);

  return { pageScrollRef, scrollToSection };
}
