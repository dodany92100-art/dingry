"use client";

import type { SmartCrmHint } from "@/lib/admin/smart-crm";

const TONE_STYLES: Record<SmartCrmHint["tone"], string> = {
  info: "border-sky-500/30 bg-sky-950/30 text-sky-100",
  warn: "border-amber-500/40 bg-amber-950/35 text-amber-100",
  success: "border-emerald-500/30 bg-emerald-950/25 text-emerald-100",
};

type AdminSmartCrmBannerProps = {
  hints: SmartCrmHint[];
};

export function AdminSmartCrmBanner({ hints }: AdminSmartCrmBannerProps) {
  const primary = hints[0];
  if (!primary) return null;

  return (
    <div
      className={`mt-4 rounded-sm border px-4 py-3 text-[11px] leading-relaxed tracking-[0.04em] transition-opacity duration-300 ${TONE_STYLES[primary.tone]}`}
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
