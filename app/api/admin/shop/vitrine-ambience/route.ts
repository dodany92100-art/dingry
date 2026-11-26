import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { jsonNoStore } from "@/lib/http";
import {
  normalizeShopVitrineAmbience,
  type ShopVitrineAmbienceConfig,
} from "@/lib/shop-vitrine-ambience";
import { isSupabaseStoreEnabled } from "@/lib/supabase/server";
import {
  readShopVitrineAmbience,
  writeShopVitrineAmbience,
} from "@/lib/supabase/shop-vitrine-ambience-store";

export const runtime = "nodejs";

function revalidateVitrineAmbience() {
  revalidatePath("/");
  revalidatePath("/websitedx");
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const ambience = isSupabaseStoreEnabled()
      ? await readShopVitrineAmbience()
      : normalizeShopVitrineAmbience(null);
    return jsonNoStore({ ambience });
  } catch {
    return jsonNoStore({ ambience: normalizeShopVitrineAmbience(null) });
  }
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

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const current = await readShopVitrineAmbience();
  const merged: ShopVitrineAmbienceConfig = normalizeShopVitrineAmbience({
    imageUrl: typeof record.imageUrl === "string" ? record.imageUrl : current.imageUrl,
    focusX: typeof record.focusX === "number" ? record.focusX : current.focusX,
    focusY: typeof record.focusY === "number" ? record.focusY : current.focusY,
  });

  try {
    const saved = await writeShopVitrineAmbience(merged);
    revalidateVitrineAmbience();
    return jsonNoStore({ ambience: saved });
  } catch {
    return jsonNoStore({ error: "Enregistrement impossible." }, { status: 500 });
  }
}