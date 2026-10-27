"use client";

import { motion } from "motion/react";
import { useCallback, useState, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

type AnimatedTabsProps = {
  tabs: string[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (tab: string) => void;
  className?: string;
  layoutId?: string;
  "aria-label"?: string;
};

export function AnimatedTabs({
  tabs,
  value: controlledValue,
  defaultValue,
  onValueChange,
  className,
  layoutId = "animated-tabs-indicator",
  "aria-label": ariaLabel = "Tabs",
}: AnimatedTabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? tabs[0] ?? "");
  const active = controlledValue ?? internalValue;

  const selectTab = useCallback(
    (tab: string) => {
      if (controlledValue === undefined) {
        setInternalValue(tab);
      }
      onValueChange?.(tab);
    },
    [controlledValue, onValueChange],
  );

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

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn(
        "inline-flex max-w-full flex-nowrap items-center gap-0.5 overflow-x-auto border border-white/10 bg-[#080808]/90 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = active === tab;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => selectTab(tab)}
            className={cn(
              "relative inline-flex min-h-9 shrink-0 cursor-pointer items-center whitespace-nowrap px-3 py-2 text-[10px] font-medium tracking-[0.16em] uppercase transition-colors duration-200 sm:min-h-10 sm:px-4 sm:text-[11px] sm:tracking-[0.2em] md:px-5",
              isActive ? "text-white" : "text-white/40 hover:text-white/75",
            )}
          >
            {isActive ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 border border-[#0066FF] bg-[#0066FF]"
                transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.75 }}
              />
            ) : null}
            <span className="relative z-[1]">{tab}</span>
          </button>
        );
      })}
    </div>
  );
}
