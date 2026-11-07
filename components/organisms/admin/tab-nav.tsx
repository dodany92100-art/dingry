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
    <div
      className="dingry-admin-glass mb-8 inline-flex max-w-full flex-wrap gap-1 rounded-full p-1"
      role="tablist"
    >
      {TABS.map(([id, label]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={tab === id}
          onClick={() => onChange(id)}
          className={`h-9 rounded-full px-4 text-[13px] font-medium tracking-tight transition duration-200 ${
            tab === id
              ? "bg-white/95 text-black shadow-sm"
              : "text-white/55 hover:bg-white/10 hover:text-white"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
