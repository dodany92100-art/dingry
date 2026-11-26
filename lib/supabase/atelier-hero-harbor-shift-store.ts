import "server-only";

import {
  DEFAULT_ATELIER_HERO_HARBOR_SHIFT,
  normalizeAtelierHeroHarborShift,
  type AtelierHeroHarborShift,
} from "@/lib/atelier-hero-harbor-shift";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isPrivateConfigTableMissing } from "@/lib/supabase/atelier-custom-store";

const ATELIER_HERO_HARBOR_SHIFT_KEY = "atelier_hero_harbor_shift";

type PrivateConfigRow = {
  payload: string;
  is_active: boolean;
};

export async function readAtelierHeroHarborShift(): Promise<AtelierHeroHarborShift> {
  const { data, error } = await supabaseAdmin()
    .from("shop_private_config")
    .select("payload, is_active")
    .eq("key", ATELIER_HERO_HARBOR_SHIFT_KEY)
    .maybeSingle();

  if (error) {
    if (isPrivateConfigTableMissing(error)) return DEFAULT_ATELIER_HERO_HARBOR_SHIFT;
    throw new Error(error.message);
  }

  const row = data as PrivateConfigRow | null;
  if (!row?.is_active || !row.payload.trim()) return DEFAULT_ATELIER_HERO_HARBOR_SHIFT;

  try {
    const parsed = JSON.parse(row.payload) as Partial<Record<keyof AtelierHeroHarborShift, unknown>>;
    return normalizeAtelierHeroHarborShift(parsed);
  } catch {
    return DEFAULT_ATELIER_HERO_HARBOR_SHIFT;
  }
}

export async function writeAtelierHeroHarborShift(
  shift: AtelierHeroHarborShift,
): Promise<AtelierHeroHarborShift> {
  const next = normalizeAtelierHeroHarborShift(shift);
  const { error } = await supabaseAdmin().from("shop_private_config").upsert(
    {
      key: ATELIER_HERO_HARBOR_SHIFT_KEY,
      payload: JSON.stringify(next),
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) throw new Error(error.message);
  return next;
}