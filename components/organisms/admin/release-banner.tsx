"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { formatCrmBuildLabel } from "@/lib/admin/crm-build-label";
import { ADMIN_CRM_RELEASE, adminCrmReleaseTitle } from "@/lib/admin/crm-release";
import { isCrmReleaseDismissed, persistCrmReleaseDismissed } from "@/lib/admin/crm-release-dismiss";

type ReleaseBannerProps = {
  onOpenChangelog?: () => void;
};

export function ReleaseBanner({ onOpenChangelog }: ReleaseBannerProps) {
  const panelId = useId();
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setDismissed(isCrmReleaseDismissed());
    setReady(true);
  }, []);

  const dismiss = useCallback(() => {
    persistCrmReleaseDismissed();
    setDismissed(true);
  }, []);

  if (!ready || dismissed) return null;

  const deployedAt = formatCrmBuildLabel();

  return (
    <div className="border-b border-[#FF3D00]/35 bg-[#0c1830]/90 px-6 py-4 md:px-10 md:py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            className="flex w-full max-w-3xl items-start gap-2 text-left"
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={() => setExpanded((open) => !open)}
          >
            <span
              className={`mt-0.5 shrink-0 text-[#8ec0ff] transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
              aria-hidden
            >
              ›
            </span>
            <span className="text-sm font-medium text-[#8ec0ff]">
              Nouveautés · {adminCrmReleaseTitle()}
              {deployedAt ? (
                <span className="font-normal text-white/50">
                  {" "}
                  — déployée le {deployedAt}
                </span>
              ) : null}
            </span>
          </button>

          <div
            id={panelId}
            className={`max-w-3xl overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
              expanded ? "max-h-[28rem] opacity-100" : "max-h-0 opacity-0"
            }`}
            aria-hidden={!expanded}
          >
            <p className="mt-2 text-sm leading-relaxed text-white/75">{ADMIN_CRM_RELEASE.summary}</p>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-white/55">
              {ADMIN_CRM_RELEASE.highlights.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            {onOpenChangelog ? (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={onOpenChangelog}
                  className="h-8 rounded-full border border-[#8ec0ff]/35 px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-[#8ec0ff] transition hover:border-[#8ec0ff]/60 hover:text-white"
                >
                  Journal complet — depuis CRM v1
                </button>
              </div>
            ) : null}
          </div>
          {!expanded ? (
            <p className="mt-1 max-w-3xl text-[11px] text-white/40">Cliquer pour lire le détail de cette version.</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="h-9 shrink-0 rounded-full border border-white/15 px-4 text-[13px] text-white/70 transition hover:border-white/35 hover:text-white"
        >
          J’ai lu
        </button>
      </div>
    </div>
  );
}