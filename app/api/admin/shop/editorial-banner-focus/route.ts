import { requireAdmin } from "@/lib/admin/auth";
import { jsonNoStore } from "@/lib/http";
import { clampEditorialBannerFocus } from "@/lib/editorial-banner-focus";
import type { EditorialBannerId } from "@/lib/editorial-sections";
import { isSupabaseStoreEnabled } from "@/lib/supabase/server";
import { writeEditorialBannerFocus } from "@/lib/supabase/editorial-banner-focus-store";

export const runtime = "nodejs";

const BANNER_IDS: readonly EditorialBannerId[] = ["dingry", "rockTheStreet", "fyma"];

function isBannerId(value: unknown): value is EditorialBannerId {
  return typeof value === "string" && (BANNER_IDS as readonly string[]).includes(value);
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  if (!isSupabaseStoreEnabled()) {
    return jsonNoStore({ error: "Enregistrement indisponible." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonNoStore({ error: "Corps invalide." }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as { banner?: unknown; x?: unknown; y?: unknown }) : {};
  if (!isBannerId(record.banner)) {
    return jsonNoStore({ error: "Bandeau invalide." }, { status: 400 });
  }
  if (typeof record.x !== "number" || !Number.isFinite(record.x)) {
    return jsonNoStore({ error: "Cadrage horizontal invalide." }, { status: 400 });
  }
  if (typeof record.y !== "number" || !Number.isFinite(record.y)) {
    return jsonNoStore({ error: "Cadrage vertical invalide." }, { status: 400 });
  }

  try {
    const saved = await writeEditorialBannerFocus(record.banner, {
      x: clampEditorialBannerFocus(record.x),
      y: clampEditorialBannerFocus(record.y),
    });
    return jsonNoStore(saved);
  } catch {
    return jsonNoStore({ error: "Enregistrement impossible." }, { status: 500 });
  }
}