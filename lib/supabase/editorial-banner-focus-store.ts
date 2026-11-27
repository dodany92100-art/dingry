import "server-only";

import {
  DEFAULT_EDITORIAL_BANNER_FOCUS,
  clampEditorialBannerFocus,
  type EditorialBannerFocus,
} from "@/lib/editorial-banner-focus";
import type { EditorialBannerId } from "@/lib/editorial-sections";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isPrivateConfigTableMissing } from "@/lib/supabase/atelier-custom-store";

const EDITORIAL_BANNER_FOCUS_KEY = "editorial_banner_focus";

type PrivateConfigRow = {
  payload: string;
  is_active: boolean;
};

export type EditorialBannerFocusMap = Record<EditorialBannerId, EditorialBannerFocus>;

function normalizeFocus(value: unknown): EditorialBannerFocus | null {
  if (!value || typeof value !== "object") return null;
  const row = value as { x?: unknown; y?: unknown };
  if (typeof row.x !== "number" || typeof row.y !== "number") return null;
  return {
    x: clampEditorialBannerFocus(row.x),
    y: clampEditorialBannerFocus(row.y),
  };
}

function mergeWithDefaults(partial: Partial<EditorialBannerFocusMap>): EditorialBannerFocusMap {
  return {
    dingry: partial.dingry ?? { ...DEFAULT_EDITORIAL_BANNER_FOCUS.dingry },
    rockTheStreet: partial.rockTheStreet ?? { ...DEFAULT_EDITORIAL_BANNER_FOCUS.rockTheStreet },
    fyma: partial.fyma ?? { ...DEFAULT_EDITORIAL_BANNER_FOCUS.fyma },
  };
}

export async function readEditorialBannerFocusMap(): Promise<EditorialBannerFocusMap> {
  const { data, error } = await supabaseAdmin()
    .from("shop_private_config")
    .select("payload, is_active")
    .eq("key", EDITORIAL_BANNER_FOCUS_KEY)
    .maybeSingle();

  if (error) {
    if (isPrivateConfigTableMissing(error)) return mergeWithDefaults({});
    throw new Error(error.message);
  }

  const row = data as PrivateConfigRow | null;
  if (!row?.is_active || !row.payload.trim()) return mergeWithDefaults({});

  try {
    const parsed = JSON.parse(row.payload) as Partial<Record<EditorialBannerId, unknown>>;
    const partial: Partial<EditorialBannerFocusMap> = {};
    for (const id of ["dingry", "rockTheStreet", "fyma"] as const) {
      const focus = normalizeFocus(parsed[id]);
      if (focus) partial[id] = focus;
    }
    return mergeWithDefaults(partial);
  } catch {
    return mergeWithDefaults({});
  }
}

export async function writeEditorialBannerFocus(
  banner: EditorialBannerId,
  focus: EditorialBannerFocus,
): Promise<EditorialBannerFocusMap> {
  const current = await readEditorialBannerFocusMap();
  const next = mergeWithDefaults({
    ...current,
    [banner]: {
      x: clampEditorialBannerFocus(focus.x),
      y: clampEditorialBannerFocus(focus.y),
    },
  });

  const { error } = await supabaseAdmin().from("shop_private_config").upsert(
    {
      key: EDITORIAL_BANNER_FOCUS_KEY,
      payload: JSON.stringify(next),
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) throw new Error(error.message);
  return next;
}