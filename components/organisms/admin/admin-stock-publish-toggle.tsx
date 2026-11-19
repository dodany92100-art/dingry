"use client";

import { motion } from "motion/react";
import type { TabId } from "@/components/organisms/admin/tab-nav";

type AdminStockPublishToggleProps = {
  tab: "produits" | "brouillons";
  onChange: (tab: TabId) => void;
  className?: string;
};

const LAYOUT_ID = "dingry-admin-stock-publish-indicator";

export function AdminStockPublishToggle({ tab, onChange, className = "" }: AdminStockPublishToggleProps) {
  return (
    <div
      className={`dingry-admin-track-linear inline-flex shrink-0 items-center gap-0.5 rounded-full p-1 max-[449px]:hidden ${className}`}
      role="group"
      aria-label="Stock publié ou brouillons"
    >
      {(
        [
          ["produits", "Stock"],
          ["brouillons", "Brouillons"],
        ] as const
      ).map(([id, label]) => {
        const active = tab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={active}
            className="dingry-admin-tab-pill relative z-0 shrink-0 rounded-full px-3 py-2 transition-colors duration-200 md:px-3.5"
          >
            {active ? (
              <motion.span
                layoutId={LAYOUT_ID}
                className="absolute inset-0 rounded-full bg-gradient-to-br from-white via-white to-violet-100/90 shadow-[0_4px_20px_rgba(167,139,250,0.3),0_0_0_1px_rgba(255,255,255,0.2)_inset]"
                transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.85 }}
                aria-hidden
              />
            ) : null}
            <span
              className={`relative z-10 whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.14em] md:tracking-[0.16em] ${
                active ? "text-[#0a0f18]" : "dingry-admin-tab-pill__label--idle text-white/50"
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