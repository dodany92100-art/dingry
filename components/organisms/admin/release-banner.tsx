"use client";

import { useCallback, useEffect, useState } from "react";
import { formatCrmBuildLabel } from "@/lib/admin/crm-build-label";
import { ADMIN_CRM_RELEASE, adminCrmReleaseTitle } from "@/lib/admin/crm-release";
import { isCrmReleaseDismissed, persistCrmReleaseDismissed } from "@/lib/admin/crm-release-dismiss";

export function ReleaseBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);

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
    <div className="border-b border-[#FF3D00]/35 bg-[#0c1830]/90 px-6 py-5 md:px-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-[#8ec0ff]">
            Mise à jour · {adminCrmReleaseTitle()}
            {deployedAt ? (
              <span className="font-normal text-white/50">
                {" "}
                — déployée le {deployedAt}
              </span>
            ) : null}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/75">{ADMIN_CRM_RELEASE.summary}</p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-white/55">
            {ADMIN_CRM_RELEASE.highlights.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
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
