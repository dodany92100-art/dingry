import "server-only";

import {
  normalizeFooterColumnShift,
  type FooterColumnShift,
} from "@/lib/footer-column-shift";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isPrivateConfigTableMissing } from "@/lib/supabase/atelier-custom-store";

const FOOTER_COLUMN_SHIFT_KEY = "footer_column_shift";

type PrivateConfigRow = {
  payload: string;
  is_active: boolean;
};

export async function readFooterColumnShift(): Promise<FooterColumnShift> {
  const { data, error } = await supabaseAdmin()
    .from("shop_private_config")
    .select("payload, is_active")
    .eq("key", FOOTER_COLUMN_SHIFT_KEY)
    .maybeSingle();

  if (error) {
    if (isPrivateConfigTableMissing(error)) return normalizeFooterColumnShift({});
    throw new Error(error.message);
  }

  const row = data as PrivateConfigRow | null;
  if (!row?.is_active || !row.payload.trim()) return normalizeFooterColumnShift({});

  try {
    const parsed = JSON.parse(row.payload) as Partial<FooterColumnShift>;
    return normalizeFooterColumnShift(parsed);
  } catch {
    return normalizeFooterColumnShift({});
  }
}

export async function writeFooterColumnShift(shift: FooterColumnShift): Promise<FooterColumnShift> {
  const next = normalizeFooterColumnShift(shift);
  const { error } = await supabaseAdmin().from("shop_private_config").upsert(
    {
      key: FOOTER_COLUMN_SHIFT_KEY,
      payload: JSON.stringify(next),
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) throw new Error(error.message);
  return next;
}
