"use client";

export type TabId = "produits" | "brouillons" | "commandes" | "lookbook";

const TABS: readonly (readonly [TabId, string])[] = [
  ["produits", "Stock"],
  ["brouillons", "Brouillons"],
  ["commandes", "Commandes"],
  ["lookbook", "Lookbook"],
];

type TabNavProps = {
  tab: TabId;
  onChange: (tab: TabId) => void;
};

export function TabNav({ tab, onChange }: TabNavProps) {
  return (
    <div className="mb-8 flex gap-2">
      {TABS.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`h-10 px-4 text-[11px] uppercase tracking-[0.22em] transition ${
            tab === id
              ? "bg-white text-black"
              : "border border-white/10 text-white/50 hover:text-white"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
