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
  /** Monte tout de suite (sections critiques : atelier, héritage). */
  eager?: boolean;
  /** Marge d’approche (viewport ou root scroll). */
  rootMargin?: string;
  /** Précharge le chunk JS avant le montage (évite le pic au scroll). */
  prefetch?: () => Promise<unknown>;
  className?: string;
  placeholderClassName?: string;
  id?: string;
};

const DEFAULT_ROOT_MARGIN = "640px 0px 96px 0px";

/** IntersectionObserver n’accepte que px ou % (pas min(), vh, calc…). */
function sanitizeRootMargin(margin: string): string {
  const tokens = margin.trim().split(/\s+/);
  if (tokens.length === 0) return DEFAULT_ROOT_MARGIN;
  const valid = (token: string) => /^-?\d+(\.\d+)?(px|%)$/.test(token);
  if (tokens.every(valid)) {
    return tokens.length === 4
      ? tokens.join(" ")
      : tokens.length === 1
        ? `${tokens[0]} ${tokens[0]} ${tokens[0]} ${tokens[0]}`
        : DEFAULT_ROOT_MARGIN;
  }
  return DEFAULT_ROOT_MARGIN;
}

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
  eager = false,
  rootMargin = DEFAULT_ROOT_MARGIN,
  prefetch,
  className,
  placeholderClassName,
  id,
}: LazyWhenVisibleProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(eager);
  const prefetchStartedRef = useRef(false);

  useEffect(() => {
    if (eager) {
      if (prefetch && !prefetchStartedRef.current) {
        prefetchStartedRef.current = true;
        void prefetch();
      }
      startTransition(() => setActive(true));
      return;
    }
    if (active) return;
    const node = sentinelRef.current;
    if (!node) return;

    const activate = () => {
      startTransition(() => setActive(true));
    };

    const safeRootMargin = sanitizeRootMargin(rootMargin);

    const observe = (root: Element | Document | null) => {
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
        { root, rootMargin: safeRootMargin, threshold: 0 },
      );

      observer.observe(node);
      return observer;
    };

    let observer = observe(scrollRootRef?.current ?? null);
    let rafId = 0;
    if (scrollRootRef && !scrollRootRef.current) {
      rafId = requestAnimationFrame(() => {
        observer.disconnect();
        observer = observe(scrollRootRef.current);
      });
    }

    return () => {
      observer.disconnect();
      if (rafId !== 0) cancelAnimationFrame(rafId);
    };
  }, [active, eager, prefetch, rootMargin, scrollRootRef]);

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
