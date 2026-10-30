"use client";

import { motion } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type AnimatedTabsProps = {
  tabs: string[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (tab: string) => void;
  className?: string;
  layoutId?: string;
  "aria-label"?: string;
  variant?: "filled" | "underline";
  endAction?: ReactNode;
  labelForTab?: (tab: string) => string;
};

export function AnimatedTabs({
  tabs,
  value: controlledValue,
  defaultValue,
  onValueChange,
  className,
  layoutId = "animated-tabs-indicator",
  "aria-label": ariaLabel = "Tabs",
  variant = "underline",
  endAction,
  labelForTab,
}: AnimatedTabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? tabs[0] ?? "");
  const [motionReady, setMotionReady] = useState(false);
  const active = controlledValue ?? internalValue;
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    setMotionReady(true);
  }, []);

  const scrollTabIntoView = useCallback((tab: string) => {
    const node = tabRefs.current.get(tab);
    const scroller = scrollRef.current;
    if (!node || !scroller) return;
    const nodeRect = node.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    const delta = nodeRect.left - scrollerRect.left - (scrollerRect.width - nodeRect.width) / 2;
    scroller.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  const selectTab = useCallback(
    (tab: string) => {
      if (controlledValue === undefined) {
        setInternalValue(tab);
      }
      onValueChange?.(tab);
      requestAnimationFrame(() => scrollTabIntoView(tab));
    },
    [controlledValue, onValueChange, scrollTabIntoView],
  );

  useEffect(() => {
    if (!active) return;
    const id = requestAnimationFrame(() => scrollTabIntoView(active));
    return () => cancelAnimationFrame(id);
  }, [active, scrollTabIntoView]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const index = tabs.indexOf(active);
      if (index < 0) return;

      let nextIndex: number | null = null;
      if (event.key === "ArrowRight") {
        nextIndex = (index + 1) % tabs.length;
      } else if (event.key === "ArrowLeft") {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = tabs.length - 1;
      }

      if (nextIndex !== null) {
        event.preventDefault();
        selectTab(tabs[nextIndex]);
      }
    },
    [active, selectTab, tabs],
  );

  const isUnderline = variant === "underline";

  return (
    <div className={cn("relative min-w-0", className)}>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-[#12151c]/40 to-transparent md:w-8"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#12151c]/40 to-transparent md:w-10"
        aria-hidden
      />
      <div
        ref={scrollRef}
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={onKeyDown}
        className={cn(
          "flex max-w-full flex-nowrap items-center gap-1 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          isUnderline ? "snap-x snap-mandatory scroll-px-4 px-1 py-0.5" : "gap-0.5 border border-white/10 bg-[#080808]/90 p-1",
        )}
      >
        {tabs.map((tab) => {
          const isActive = active === tab;
          return (
            <button
              key={tab}
              ref={(node) => {
                if (node) tabRefs.current.set(tab, node);
                else tabRefs.current.delete(tab);
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => selectTab(tab)}
              className={cn(
                "relative shrink-0 cursor-pointer whitespace-nowrap uppercase transition-colors duration-200 active:scale-[0.97]",
                isUnderline
                  ? "snap-center px-3.5 py-2.5 text-[10px] font-medium tracking-[0.2em] sm:px-4 sm:text-[11px] sm:tracking-[0.22em]"
                  : "inline-flex min-h-9 items-center px-3 py-2 text-[10px] font-medium tracking-[0.16em] sm:min-h-10 sm:px-4 sm:text-[11px] sm:tracking-[0.2em] md:px-5",
                isActive ? "text-white" : "text-white/35 hover:text-white/70",
              )}
            >
              {isActive && isUnderline ? (
                motionReady ? (
                  <motion.span
                    layoutId={layoutId}
                    className="absolute inset-x-2 bottom-1 h-[2px] rounded-full bg-[#0066FF] shadow-[0_0_12px_rgba(0,102,255,0.55)]"
                    transition={{ type: "spring", stiffness: 480, damping: 34, mass: 0.7 }}
                  />
                ) : (
                  <span className="absolute inset-x-2 bottom-1 h-[2px] rounded-full bg-[#0066FF] shadow-[0_0_12px_rgba(0,102,255,0.55)]" />
                )
              ) : null}
              {isActive && !isUnderline ? (
                motionReady ? (
                  <motion.span
                    layoutId={layoutId}
                    className="absolute inset-0 border border-[#0066FF] bg-[#0066FF]"
                    transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.75 }}
                  />
                ) : (
                  <span className="absolute inset-0 border border-[#0066FF] bg-[#0066FF]" />
                )
              ) : null}
              <span className="relative z-[1]">{labelForTab?.(tab) ?? tab}</span>
            </button>
          );
        })}
        {endAction ? (
          <div className="relative z-[1] shrink-0 snap-center pl-1">{endAction}</div>
        ) : null}
      </div>
    </div>
  );
}
