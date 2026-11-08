"use client";

type AdminStockPreviewToggleProps = {
  active: boolean;
  onChange: (active: boolean) => void;
};

function EyeIcon({ active }: { active: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={`h-4 w-4 ${active ? "text-[#7EB3FF]" : "text-white/45"}`}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

export function AdminStockPreviewToggle({ active, onChange }: AdminStockPreviewToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      aria-pressed={active}
      title={active ? "Revenir au mode édition CRM" : "Aperçu temps réel boutique"}
      className={`flex h-9 max-w-full shrink-0 items-center gap-2 border px-2.5 text-[10px] uppercase tracking-[0.12em] transition sm:px-3 sm:tracking-[0.16em] ${
        active
          ? "border-[#0066FF]/60 bg-[#0066FF]/10 text-[#7EB3FF]"
          : "border-zinc-800 bg-zinc-950 text-white/55 hover:border-zinc-600 hover:text-white/80"
      }`}
    >
      <EyeIcon active={active} />
      <span className="hidden sm:inline lg:hidden">{active ? "Édition" : "Aperçu"}</span>
      <span className="hidden lg:inline">{active ? "Mode édition" : "Aperçu temps réel"}</span>
    </button>
  );
}
