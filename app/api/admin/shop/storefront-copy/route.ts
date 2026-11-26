import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { jsonNoStore } from "@/lib/http";
import {
  mergeShopStorefrontCopyPatch,
  normalizeShopStorefrontCopy,
} from "@/lib/shop-storefront-copy";
import { isSupabaseStoreEnabled } from "@/lib/supabase/server";
import {
  readShopStorefrontCopy,
  writeShopStorefrontCopy,
} from "@/lib/supabase/shop-storefront-copy-store";

export const runtime = "nodejs";

function revalidateStorefrontCopy() {
  revalidatePath("/");
  revalidatePath("/websitedx");
  revalidatePath("/heritage");
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const copy = isSupabaseStoreEnabled()
      ? await readShopStorefrontCopy()
      : normalizeShopStorefrontCopy(null);
    return jsonNoStore({ copy });
  } catch {
    return jsonNoStore({ copy: normalizeShopStorefrontCopy(null) });
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

  try {
    const current = await readShopStorefrontCopy();
    const merged = mergeShopStorefrontCopyPatch(current, body);
    const saved = await writeShopStorefrontCopy(merged);
    revalidateStorefrontCopy();
    return jsonNoStore({ copy: saved });
  } catch {
    return jsonNoStore({ error: "Enregistrement impossible." }, { status: 500 });
  }
}