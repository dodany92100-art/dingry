import { jsonNoStore } from "@/lib/http";
import { DEFAULT_FOOTER_COLUMN_SHIFT } from "@/lib/footer-column-shift";
import { isSupabaseStoreEnabled } from "@/lib/supabase/server";
import { readFooterColumnShift } from "@/lib/supabase/footer-column-shift-store";

export const runtime = "nodejs";

export async function GET() {
  if (!isSupabaseStoreEnabled()) return jsonNoStore(DEFAULT_FOOTER_COLUMN_SHIFT);
  try {
    return jsonNoStore(await readFooterColumnShift());
  } catch {
    return jsonNoStore(DEFAULT_FOOTER_COLUMN_SHIFT);
  }
}
