"use client";

import { useEffect, useState } from "react";
import { subscribeCrmAdminLoadProgress } from "@/lib/crm-admin-load-progress";

/** Barre sous ROCKTHESTREET — passage CRM / chargement données. */
export function CrmAdminLoadProgressTrack() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => subscribeCrmAdminLoadProgress((v, on) => {
    setProgress(v);
    setVisible(on);
  }), []);

  if (!visible && progress <= 0) return null;

  return (
    <div
      className="crm-admin-load-progress mt-7 w-[min(16rem,72vw)]"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      aria-live="polite"
    >
      <div className="crm-admin-load-progress__track">
        <div
          className="crm-admin-load-progress__fill"
          style={{ transform: `scaleX(${Math.max(0.04, progress)})` }}
        />
        <div
          className="crm-admin-load-progress__pulse motion-reduce:hidden"
          style={{ left: `${Math.min(98, Math.max(2, progress * 100))}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}