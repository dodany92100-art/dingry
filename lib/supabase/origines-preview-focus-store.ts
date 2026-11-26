import "server-only";

import {
  clampOriginesPreviewFocusY,
  clampOriginesPreviewOpacity,
  DEFAULT_ORIGINES_PREVIEW_FOCUS_Y,
  DEFAULT_ORIGINES_PREVIEW_OPACITY,
} from "@/lib/origines-preview-focus";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isPrivateConfigTableMissing } from "@/lib/supabase/atelier-custom-store";

const ORIGINES_PREVIEW_FOCUS_KEY = "origines_preview_focus";

type PrivateConfigRow = {
  payload: string;
  is_active: boolean;
};

export type OriginesPreviewAdjust = {
  y: number;
  opacity: number;
};

const DEFAULT_ADJUST: OriginesPreviewAdjust = {
  y: DEFAULT_ORIGINES_PREVIEW_FOCUS_Y,
  opacity: DEFAULT_ORIGINES_PREVIEW_OPACITY,
};

export async function readOriginesPreviewAdjust(): Promise<OriginesPreviewAdjust> {
  const { data, error } = await supabaseAdmin()
    .from("shop_private_config")
    .select("payload, is_active")
    .eq("key", ORIGINES_PREVIEW_FOCUS_KEY)
    .maybeSingle();

  if (error) {
    if (isPrivateConfigTableMissing(error)) return DEFAULT_ADJUST;
    throw new Error(error.message);
  }

  const row = data as PrivateConfigRow | null;
  if (!row?.is_active || !row.payload.trim()) return DEFAULT_ADJUST;

  try {
    const parsed = JSON.parse(row.payload) as { y?: unknown; opacity?: unknown };
    return {
      y: typeof parsed.y === "number" ? clampOriginesPreviewFocusY(parsed.y) : DEFAULT_ORIGINES_PREVIEW_FOCUS_Y,
      opacity:
        typeof parsed.opacity === "number"
          ? clampOriginesPreviewOpacity(parsed.opacity)
          : DEFAULT_ORIGINES_PREVIEW_OPACITY,
    };
  } catch {
    return DEFAULT_ADJUST;
  }
}

export async function writeOriginesPreviewAdjust(adjust: OriginesPreviewAdjust): Promise<OriginesPreviewAdjust> {
  const next = {
    y: clampOriginesPreviewFocusY(adjust.y),
    opacity: clampOriginesPreviewOpacity(adjust.opacity),
  };
  const { error } = await supabaseAdmin().from("shop_private_config").upsert(
    {
      key: ORIGINES_PREVIEW_FOCUS_KEY,
      payload: JSON.stringify(next),
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) throw new Error(error.message);
  return next;
}
