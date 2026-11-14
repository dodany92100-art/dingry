"use client";

import { useEffect } from "react";
import {
  ADMIN_CRM_RELEASE_HISTORY,
  adminCrmReleaseVersionLabel,
} from "@/lib/admin/crm-release";

type CrmChangelogDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function CrmChangelogDialog({ open, onClose }: CrmChangelogDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Fermer le journal des versions"
        className="absolute inset-0 bg-[#02040a]/88"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="crm-changelog-title"
        className="relative z-[1] flex max-h-[min(92vh,40rem)] w-full max-w-2xl flex-col border border-white/10 bg-[#0c1830] shadow-[0_24px_80px_rgb(0_0_0/0.55)] sm:rounded-lg"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4 md:px-6">
          <div>
            <p id="crm-changelog-title" className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#8ec0ff]">
              Journal CRM
            </p>
            <p className="mt-1 text-sm text-white/70">
              Toutes les mises à jour depuis{" "}
              <span className="text-white/90">{ADMIN_CRM_RELEASE_HISTORY.at(-1)?.deployedAtLabel}</span>
              {ADMIN_CRM_RELEASE_HISTORY.at(-1)?.versionHint
                ? ` (CRM ${adminCrmReleaseVersionLabel(ADMIN_CRM_RELEASE_HISTORY.at(-1)!)})`
                : null}
              .
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 shrink-0 rounded-full border border-white/15 px-4 text-[12px] text-white/75 hover:border-white/35 hover:text-white"
          >
            Fermer
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 md:px-6">
          <div className="space-y-5">
            {ADMIN_CRM_RELEASE_HISTORY.map((entry, index) => (
              <article key={entry.id} className="border-l-2 border-[#FF3D00]/40 pl-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
                  {entry.deployedAtLabel}
                  <span className="text-white/30"> · </span>
                  {adminCrmReleaseVersionLabel(entry)}
                  {index === 0 ? (
                    <span className="normal-case tracking-normal text-[#8ec0ff]/80"> — actuelle</span>
                  ) : null}
                </p>
                <p className="mt-1 text-sm font-medium text-white/90">{entry.title}</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-white/55">
                  {entry.highlights.map((line) => (
                    <li key={`${entry.id}-${line}`}>{line}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}