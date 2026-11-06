"use client";

import { ArrowDownWideNarrow, Clock3 } from "lucide-react";

type AdminStockNewestSortToggleProps = {
  active: boolean;
  onChange: (active: boolean) => void;
};

export function AdminStockNewestSortToggle({ active, onChange }: AdminStockNewestSortToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onChange(!active)}
      className={`inline-flex h-9 shrink-0 items-center gap-2 border px-3 text-[10px] uppercase tracking-[0.18em] transition md:text-[11px] md:tracking-[0.2em] ${
        active
          ? "border-[#0066FF] bg-[#0066FF]/15 text-white shadow-[0_0_20px_rgba(0,102,255,0.25)]"
          : "border-zinc-800 bg-zinc-900 text-white/55 hover:border-zinc-600 hover:text-white"
      }`}
    >
      <span className="flex items-center gap-1.5">
        <Clock3 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
        <ArrowDownWideNarrow className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={1.75} aria-hidden />
      </span>
      Derniers entrés
    </button>
  );
}
