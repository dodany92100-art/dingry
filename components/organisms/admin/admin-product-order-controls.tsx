"use client";

import { Pin, Trash2 } from "lucide-react";
import type { AdminProduct } from "@/lib/admin/types";

type AdminProductOrderControlsProps = {
  product: AdminProduct;
  busy: boolean;
  onTogglePin: (product: AdminProduct) => void;
  onDelete?: (product: AdminProduct) => void;
  disableReorder?: boolean;
  /** Poignée + épingle compactes (overlay image). */
  compact?: boolean;
  layout: "card" | "row";
};

/** Poignée visuelle + épingle — le drag est géré par {@link AdminReorderSurface}. */
export function AdminProductOrderControls({
  product,
  busy,
  onTogglePin,
  onDelete,
  disableReorder = false,
  compact = false,
  layout,
}: AdminProductOrderControlsProps) {
  const pinActive = product.isPinned;
  const gripClass = compact
    ? "flex h-7 w-7 items-center justify-center border border-zinc-600/80 text-zinc-400"
    : `flex h-8 w-8 items-center justify-center border border-zinc-700 text-zinc-500 transition hover:border-zinc-500 hover:text-white ${
        disableReorder ? "" : "cursor-grab"
      }`;
  const pinClass = compact
    ? `flex h-7 w-7 items-center justify-center border transition disabled:opacity-40 ${
        pinActive
          ? "border-[#0066FF] bg-[#0066FF]/20 text-[#0066FF]"
          : "border-zinc-600/80 text-zinc-400 hover:text-white"
      }`
    : `flex h-8 w-8 items-center justify-center border transition disabled:opacity-40 ${
        pinActive
          ? "border-[#0066FF] bg-[#0066FF]/15 text-[#0066FF]"
          : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-white"
      }`;

  if (compact && layout === "card") {
    return (
      <>
        <span aria-hidden title={disableReorder ? undefined : "Glisser la carte"} className={gripClass}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="9" cy="7" r="1.5" />
            <circle cx="15" cy="7" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="17" r="1.5" />
            <circle cx="15" cy="17" r="1.5" />
          </svg>
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={() => onTogglePin(product)}
          aria-pressed={pinActive}
          aria-label={pinActive ? `Retirer l'épinglage de ${product.name}` : `Épingler ${product.name}`}
          className={pinClass}
        >
          <Pin className="h-3 w-3" strokeWidth={1.75} fill={pinActive ? "currentColor" : "none"} />
        </button>
        {onDelete ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onDelete(product)}
            aria-label={`Supprimer ${product.name}`}
            className="flex h-7 w-7 items-center justify-center border border-red-500/40 text-red-400 transition hover:border-red-400 hover:text-red-300 disabled:opacity-40"
          >
            <Trash2 className="h-3 w-3" strokeWidth={1.75} />
          </button>
        ) : null}
      </>
    );
  }

  return (
    <div
      className={
        layout === "card"
          ? "flex items-center justify-between gap-2 border-b border-zinc-800 px-2 py-1.5"
          : "flex shrink-0 items-center gap-1.5"
      }
    >
      <span
        aria-hidden
        title={disableReorder ? undefined : "Glisser la carte pour réordonner"}
        className={`flex h-8 w-8 items-center justify-center border border-zinc-700 text-zinc-500 ${
          disableReorder ? "opacity-30" : "opacity-80"
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="9" cy="7" r="1.5" />
          <circle cx="15" cy="7" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="17" r="1.5" />
          <circle cx="15" cy="17" r="1.5" />
        </svg>
      </span>
      <button
        type="button"
        disabled={busy}
        onClick={() => onTogglePin(product)}
        aria-pressed={pinActive}
        aria-label={pinActive ? `Retirer l'épinglage de ${product.name}` : `Épingler ${product.name} en tête`}
        className={`flex h-8 w-8 items-center justify-center border transition disabled:opacity-40 ${
          pinActive
            ? "border-[#0066FF] bg-[#0066FF]/15 text-[#0066FF]"
            : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-white"
        }`}
      >
        <Pin className="h-3.5 w-3.5" strokeWidth={1.75} fill={pinActive ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
