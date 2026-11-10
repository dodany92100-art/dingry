"use client";

import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "@/lib/utils";

type LazyWhenVisibleProps = {
  children: ReactNode;
  scrollRootRef?: RefObject<HTMLElement | null>;
  /** Marge d’approche (viewport ou root scroll). */
  rootMargin?: string;
  /** Précharge le chunk JS avant le montage (évite le pic au scroll). */
  prefetch?: () => Promise<unknown>;
  className?: string;
  placeholderClassName?: string;
  id?: string;
};

function scheduleAfterPaint(activate: () => void) {
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(activate, { timeout: 150 });
    return;
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(activate);
  });
}

/** Monte les enfants à l’approche du scroll — prefetch + startTransition pour garder le fil fluide. */
export function LazyWhenVisible({
  children,
  scrollRootRef,
  rootMargin = "min(85vh, 640px) 0px 96px 0px",
  prefetch,
  className,
  placeholderClassName,
  id,
}: LazyWhenVisibleProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const prefetchStartedRef = useRef(false);

  useEffect(() => {
    if (active) return;
    const node = sentinelRef.current;
    if (!node) return;

    const activate = () => {
      startTransition(() => setActive(true));
    };

    const root = scrollRootRef?.current ?? null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();

        const run = () => {
          scheduleAfterPaint(activate);
        };

        if (prefetch && !prefetchStartedRef.current) {
          prefetchStartedRef.current = true;
          void prefetch().finally(run);
        } else {
          run();
        }
      },
      { root, rootMargin, threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [active, prefetch, rootMargin, scrollRootRef]);

  return (
    <div
      ref={sentinelRef}
      id={id}
      className={cn(
        className,
        !active && "dingry-lazy-section-placeholder",
        !active && placeholderClassName,
      )}
    >
      {active ? <div className="dingry-lazy-section-mounted">{children}</div> : null}
    </div>
  );
}
