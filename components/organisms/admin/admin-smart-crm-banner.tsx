"use client";

import type { SmartCrmHint } from "@/lib/admin/smart-crm";

const TONE_STYLES: Record<SmartCrmHint["tone"], string> = {
  info: "border-sky-200 bg-sky-50/95 text-sky-900",
  warn: "border-amber-200 bg-amber-50/95 text-amber-950",
  success: "border-emerald-200 bg-emerald-50/95 text-emerald-900",
};

type AdminSmartCrmBannerProps = {
  hints: SmartCrmHint[];
};

export function AdminSmartCrmBanner({ hints }: AdminSmartCrmBannerProps) {
  const primary = hints[0];
  if (!primary) return null;

  return (
    <div
      className={`mt-4 rounded-md border px-4 py-3 text-[11px] leading-relaxed tracking-[0.04em] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-opacity duration-300 ${TONE_STYLES[primary.tone]}`}
      role="status"
    >
      {primary.message}
      {hints.length > 1 ? (
        <ul className="mt-2 list-inside list-disc space-y-1 text-[10px] opacity-90">
          {hints.slice(1, 4).map((hint) => (
            <li key={hint.id}>{hint.message}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
