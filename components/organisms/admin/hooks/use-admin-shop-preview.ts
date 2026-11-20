"use client";

import { useCallback, useState } from "react";
import { altoShopEntryUrl } from "@/lib/alto-switch-urls";

export function useAdminShopPreview() {
  const [busy, setBusy] = useState(false);

  const openPreview = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/preview/enable", {
        method: "POST",
        credentials: "same-origin",
      });
      if (response.status === 404) return;
      if (!response.ok) return;
      const body = (await response.json()) as { openUrl?: string };
      const url = body.openUrl?.trim() || altoShopEntryUrl();
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const closePreview = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/admin/preview/disable", { method: "POST", credentials: "same-origin" });
    } finally {
      setBusy(false);
    }
  }, [busy]);

  return { openPreview, closePreview, busy, previewUiEnabled: process.env.NEXT_PUBLIC_DINGRY_PREVIEW_UI === "1" };
}