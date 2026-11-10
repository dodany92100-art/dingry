"use client";

import { motion } from "motion/react";

export type TabId = "produits" | "brouillons" | "commandes" | "lookbook" | "banniere" | "atelier";

const TABS: readonly (readonly [TabId, string])[] = [
  ["produits", "Stock"],
  ["brouillons", "Brouillons"],
  ["commandes", "Commandes"],
  ["banniere", "Bannière"],
  ["atelier", "Atelier CUSTOM"],
  ["lookbook", "Lookbook"],
];

const INDICATOR_LAYOUT_ID = "dingry-admin-main-tab-indicator";

type TabNavProps = {
  tab: TabId;
  onChange: (tab: TabId) => void;
  className?: string;
  /** Sur &lt; 450px, masquer Stock/Brouillons (sélecteur contextuel à la place). */
  hideStockTabsOnNarrow?: boolean;
};

export function TabNav({ tab, onChange, className = "", hideStockTabsOnNarrow = false }: TabNavProps) {
  return (
    <div
      className={`dingry-admin-glass mb-8 inline-flex max-w-full items-center gap-0.5 overflow-x-auto overscroll-x-contain scroll-smooth rounded-full p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-violet-400/15 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
      role="tablist"
      aria-label="Sections administration"
    >
      {TABS.map(([id, label]) => {
        const narrowHidden =
          hideStockTabsOnNarrow && (id === "produits" || id === "brouillons") ? "max-[449px]:hidden" : "";
        const active = tab === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`relative z-0 shrink-0 rounded-full px-3 py-1.5 transition-colors duration-200 md:px-4 md:py-2.5 ${narrowHidden}`}
          >
            {active ? (
              <motion.span
                layoutId={INDICATOR_LAYOUT_ID}
                className="absolute inset-0 rounded-full bg-gradient-to-br from-white via-white to-violet-100/90 shadow-[0_4px_24px_rgba(167,139,250,0.35),0_0_0_1px_rgba(255,255,255,0.25)_inset]"
                transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.85 }}
                aria-hidden
              />
            ) : null}
            <span
              className={`relative z-10 block whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.18em] md:text-[11px] md:tracking-[0.2em] ${
                active ? "text-[#0a0f18]" : "text-white/50 hover:text-white/85"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
