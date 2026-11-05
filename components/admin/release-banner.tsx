"use client";

import { useCallback, useEffect, useState } from "react";
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

  return (
    <div className="border-b border-[#0066FF]/35 bg-[#041226] px-6 py-5 md:px-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#7EB3FF]">
            Mise à jour · {ADMIN_CRM_RELEASE.title}
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
          className="h-9 shrink-0 border border-white/15 px-3 text-[10px] uppercase tracking-[0.18em] text-white/70 transition hover:border-white/35 hover:text-white"
        >
          J’ai lu
        </button>
      </div>
    </div>
  );
}
