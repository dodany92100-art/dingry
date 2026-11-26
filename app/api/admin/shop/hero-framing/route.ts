import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { jsonNoStore } from "@/lib/http";
import {
  normalizeShopHeroFramingMap,
  normalizeShopHeroSlideFraming,
  type ShopHeroSlideFraming,
} from "@/lib/shop-hero-framing";
import { DEFAULT_SHOP_HERO_FRAMING_DEFAULTS } from "@/lib/shop-hero-slides";
import { isSupabaseStoreEnabled } from "@/lib/supabase/server";
import {
  readShopHeroFramingMap,
  writeShopHeroFramingMap,
} from "@/lib/supabase/shop-hero-framing-store";

export const runtime = "nodejs";

function revalidateHeroFraming() {
  revalidatePath("/");
  revalidatePath("/websitedx");
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const framing = isSupabaseStoreEnabled()
      ? await readShopHeroFramingMap()
      : { ...DEFAULT_SHOP_HERO_FRAMING_DEFAULTS };
    return jsonNoStore({ framing });
  } catch {
    return jsonNoStore({ framing: DEFAULT_SHOP_HERO_FRAMING_DEFAULTS });
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
      const saved = await writeShopHeroFramingMap({ ...DEFAULT_SHOP_HERO_FRAMING_DEFAULTS });
      revalidateHeroFraming();
      return jsonNoStore({ framing: saved });
    } catch {
      return jsonNoStore({ error: "Réinitialisation impossible." }, { status: 500 });
    }
  }

  const slideId = typeof record.slideId === "string" ? record.slideId.trim() : "";
  const framingRaw = record.framing;
  if (!slideId || !framingRaw || typeof framingRaw !== "object") {
    return jsonNoStore({ error: "slideId et framing requis." }, { status: 400 });
  }

  const base =
    DEFAULT_SHOP_HERO_FRAMING_DEFAULTS[slideId] ??
    DEFAULT_SHOP_HERO_FRAMING_DEFAULTS["lookbook-hero"] ?? {
      focalX: 50,
      focalY: 40,
      scale: 1,
    };

  const framing = normalizeShopHeroSlideFraming(
    framingRaw as Partial<ShopHeroSlideFraming>,
    base,
  );

  try {
    const current = await readShopHeroFramingMap();
    const merged = normalizeShopHeroFramingMap(
      { ...current, [slideId]: framing },
      DEFAULT_SHOP_HERO_FRAMING_DEFAULTS,
    );
    const saved = await writeShopHeroFramingMap(merged);
    revalidateHeroFraming();
    return jsonNoStore({ framing: saved, slideId, savedFraming: saved[slideId] });
  } catch {
    return jsonNoStore({ error: "Enregistrement impossible." }, { status: 500 });
  }
}