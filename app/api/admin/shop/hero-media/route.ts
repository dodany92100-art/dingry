import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { jsonNoStore } from "@/lib/http";
import { normalizeShopHeroMediaMap, type ShopHeroMediaMap } from "@/lib/shop-hero-media";
import { isSupabaseStoreEnabled } from "@/lib/supabase/server";
import { readShopHeroMediaMap, writeShopHeroMediaMap } from "@/lib/supabase/shop-hero-media-store";

export const runtime = "nodejs";

function revalidateHeroMedia() {
  revalidatePath("/");
  revalidatePath("/websitedx");
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const media = isSupabaseStoreEnabled() ? await readShopHeroMediaMap() : {};
    return jsonNoStore({ media });
  } catch {
    return jsonNoStore({ media: {} });
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

  if (record.resetAll === true) {
    try {
      const saved = await writeShopHeroMediaMap({});
      revalidateHeroMedia();
      return jsonNoStore({ media: saved });
    } catch {
      return jsonNoStore({ error: "Réinitialisation impossible." }, { status: 500 });
    }
  }

  const slideId = typeof record.slideId === "string" ? record.slideId.trim() : "";
  if (!slideId) {
    return jsonNoStore({ error: "slideId requis." }, { status: 400 });
  }

  try {
    const current = await readShopHeroMediaMap();
    const next: ShopHeroMediaMap = { ...current };
    if (record.clear === true) {
      delete next[slideId];
    } else {
      const imageUrl = typeof record.imageUrl === "string" ? record.imageUrl.trim() : "";
      if (!imageUrl) {
        return jsonNoStore({ error: "imageUrl requis." }, { status: 400 });
      }
      next[slideId] = imageUrl;
    }
    const saved = await writeShopHeroMediaMap(next);
    revalidateHeroMedia();
    return jsonNoStore({ media: saved, slideId });
  } catch {
    return jsonNoStore({ error: "Enregistrement impossible." }, { status: 500 });
  }
}