import { requireAdmin } from "@/lib/admin/auth";
import { jsonNoStore } from "@/lib/http";
import type { FooterColumnShift } from "@/lib/footer-column-shift";
import { isSupabaseStoreEnabled } from "@/lib/supabase/server";
import { writeFooterColumnShift } from "@/lib/supabase/footer-column-shift-store";

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

  const record = body && typeof body === "object" ? (body as Partial<FooterColumnShift>) : {};
  if (
    !isShiftNumber(record.marque) ||
    !isShiftNumber(record.boutique) ||
    !isShiftNumber(record.legal) ||
    !isShiftNumber(record.logo) ||
    !isShiftNumber(record.instagram)
  ) {
    return jsonNoStore({ error: "Décalage invalide." }, { status: 400 });
  }

  try {
    const saved = await writeFooterColumnShift({
      marque: record.marque,
      boutique: record.boutique,
      legal: record.legal,
      logo: record.logo,
      instagram: record.instagram,
    });
    return jsonNoStore(saved);
  } catch {
    return jsonNoStore({ error: "Enregistrement impossible." }, { status: 500 });
  }
}
