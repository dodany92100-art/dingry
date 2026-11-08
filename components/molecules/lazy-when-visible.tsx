"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/utils";

type LazyWhenVisibleProps = {
  children: ReactNode;
  scrollRootRef?: RefObject<HTMLElement | null>;
  rootMargin?: string;
  className?: string;
  placeholderClassName?: string;
  id?: string;
};

/** Monte les enfants au scroll (ou à l’approche du viewport) pour différer JS + fetch. */
export function LazyWhenVisible({
  children,
  scrollRootRef,
  rootMargin = "480px 0px",
  className,
  placeholderClassName,
  id,
}: LazyWhenVisibleProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (active) return;
    const node = sentinelRef.current;
    if (!node) return;
    const root = scrollRootRef?.current ?? null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true);
          observer.disconnect();
        }
      },
      { root, rootMargin, threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [active, rootMargin, scrollRootRef]);

  return (
    <div ref={sentinelRef} id={id} className={cn(className, !active && placeholderClassName)}>
      {active ? children : null}
    </div>
  );
}
