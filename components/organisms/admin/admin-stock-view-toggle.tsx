"use client";

export type AdminStockViewMode = "grid" | "list";

type AdminStockViewToggleProps = {
  mode: AdminStockViewMode;
  onChange: (mode: AdminStockViewMode) => void;
};

function GridIcon({ active }: { active: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className={`h-4 w-4 ${active ? "text-white" : "text-white/45"}`}
      fill="currentColor"
    >
      <rect x="2" y="2" width="7" height="7" rx="1" />
      <rect x="11" y="2" width="7" height="7" rx="1" />
      <rect x="2" y="11" width="7" height="7" rx="1" />
      <rect x="11" y="11" width="7" height="7" rx="1" />
    </svg>
  );
}

function ListIcon({ active }: { active: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className={`h-4 w-4 ${active ? "text-white" : "text-white/45"}`}
      fill="currentColor"
    >
      <rect x="2" y="3" width="16" height="2.5" rx="0.5" />
      <rect x="2" y="8.75" width="16" height="2.5" rx="0.5" />
      <rect x="2" y="14.5" width="16" height="2.5" rx="0.5" />
    </svg>
  );
}

export function AdminStockViewToggle({ mode, onChange }: AdminStockViewToggleProps) {
  return (
    <div
      className="flex shrink-0 items-center gap-0.5 rounded-sm border border-zinc-800 bg-zinc-950 p-0.5"
      role="group"
      aria-label="Mode d’affichage stock"
    >
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-pressed={mode === "grid"}
        title="Grille visuelle"
        className={`flex h-8 w-9 items-center justify-center transition ${
          mode === "grid" ? "bg-zinc-800" : "hover:bg-zinc-900"
        }`}
      >
        <GridIcon active={mode === "grid"} />
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={mode === "list"}
        title="Tableau compact"
        className={`flex h-8 w-9 items-center justify-center transition ${
          mode === "list" ? "bg-zinc-800" : "hover:bg-zinc-900"
        }`}
      >
        <ListIcon active={mode === "list"} />
      </button>
    </div>
  );
}
