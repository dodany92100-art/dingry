import { requireAdmin } from "@/lib/admin/auth";
import { jsonNoStore } from "@/lib/http";
import { isSupabaseStoreEnabled } from "@/lib/supabase/server";
import { writeOriginesPreviewAdjust } from "@/lib/supabase/origines-preview-focus-store";

export const runtime = "nodejs";

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

  const record = body && typeof body === "object" ? (body as { y?: unknown; opacity?: unknown }) : {};
  if (typeof record.y !== "number" || !Number.isFinite(record.y)) {
    return jsonNoStore({ error: "Cadrage invalide." }, { status: 400 });
  }
  if (typeof record.opacity !== "number" || !Number.isFinite(record.opacity)) {
    return jsonNoStore({ error: "Opacité invalide." }, { status: 400 });
  }

  try {
    const saved = await writeOriginesPreviewAdjust({ y: record.y, opacity: record.opacity });
    return jsonNoStore(saved);
  } catch {
    return jsonNoStore({ error: "Enregistrement impossible." }, { status: 500 });
  }
}
