"use client";

import type { SmartCrmHint } from "@/lib/admin/smart-crm";

const TONE_STYLES: Record<SmartCrmHint["tone"], string> = {
  info: "border-white/15 bg-white/5 text-white/80",
  warn: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  success: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
};

type AdminSmartCrmBannerProps = {
  hints: SmartCrmHint[];
};

export function AdminSmartCrmBanner({ hints }: AdminSmartCrmBannerProps) {
  const primary = hints[0];
  if (!primary) return null;

  return (
    <div
      className={`mt-4 rounded-lg border px-4 py-3 text-sm leading-relaxed transition-opacity duration-300 ${TONE_STYLES[primary.tone]}`}
      role="status"
    >
      {primary.message}
      {hints.length > 1 ? (
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm opacity-90">
          {hints.slice(1, 4).map((hint) => (
            <li key={hint.id}>{hint.message}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
