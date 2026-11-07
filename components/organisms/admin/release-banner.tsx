"use client";

import { useCallback, useEffect, useState } from "react";
import { formatCrmBuildLabel } from "@/lib/admin/crm-build-label";
import {
  ADMIN_CRM_RELEASE,
  ADMIN_CRM_RELEASE_DISMISS_KEY,
  ADMIN_CRM_VERSION,
} from "@/lib/admin/crm-release";

export function ReleaseBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(ADMIN_CRM_RELEASE_DISMISS_KEY) === ADMIN_CRM_VERSION);
    } catch {
      setDismissed(false);
    }
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(ADMIN_CRM_RELEASE_DISMISS_KEY, ADMIN_CRM_VERSION);
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }, []);

  if (dismissed) return null;

  const deployedAt = formatCrmBuildLabel();

  return (
    <div className="border-b border-[#0066FF]/35 bg-[#0c1830]/90 px-6 py-5 md:px-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-[#8ec0ff]">
            Mise à jour · {ADMIN_CRM_RELEASE.title}
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
