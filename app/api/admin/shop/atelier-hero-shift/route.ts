import { requireAdmin } from "@/lib/admin/auth";
import { jsonNoStore } from "@/lib/http";
import type { AtelierHeroHarborShift } from "@/lib/atelier-hero-harbor-shift";
import { isSupabaseStoreEnabled } from "@/lib/supabase/server";
import { writeAtelierHeroHarborShift } from "@/lib/supabase/atelier-hero-harbor-shift-store";

export const runtime = "nodejs";

function isShiftNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
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

  const record = body && typeof body === "object" ? (body as Partial<AtelierHeroHarborShift>) : {};
  if (
    !isShiftNumber(record.logoX) ||
    !isShiftNumber(record.logoY) ||
    !isShiftNumber(record.ctaX) ||
    !isShiftNumber(record.ctaY)
  ) {
    return jsonNoStore({ error: "Décalage invalide." }, { status: 400 });
  }

  try {
    const saved = await writeAtelierHeroHarborShift({
      logoX: record.logoX,
      logoY: record.logoY,
      ctaX: record.ctaX,
      ctaY: record.ctaY,
    });
    return jsonNoStore(saved);
  } catch {
    return jsonNoStore({ error: "Enregistrement impossible." }, { status: 500 });
  }
}