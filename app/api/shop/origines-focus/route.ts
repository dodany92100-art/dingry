import { jsonNoStore } from "@/lib/http";
import {
  DEFAULT_ORIGINES_PREVIEW_FOCUS_Y,
  DEFAULT_ORIGINES_PREVIEW_OPACITY,
} from "@/lib/origines-preview-focus";
import { isSupabaseStoreEnabled } from "@/lib/supabase/server";
import { readOriginesPreviewAdjust } from "@/lib/supabase/origines-preview-focus-store";

export const runtime = "nodejs";

const FALLBACK = { y: DEFAULT_ORIGINES_PREVIEW_FOCUS_Y, opacity: DEFAULT_ORIGINES_PREVIEW_OPACITY };

export async function GET() {
  if (!isSupabaseStoreEnabled()) return jsonNoStore(FALLBACK);
  try {
    return jsonNoStore(await readOriginesPreviewAdjust());
  } catch {
    return jsonNoStore(FALLBACK);
  }
}
