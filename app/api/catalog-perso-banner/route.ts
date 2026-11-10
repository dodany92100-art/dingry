import { NextResponse } from "next/server";
import { loadStoreReadOnly, StoreUnavailableError } from "@/lib/admin/store";
import { resolveShopCatalogPersoBanner } from "@/lib/catalog-perso-banner";
import {
  getSupabaseShopBannerByPosition,
  rowToAdminCatalogPersoBanner,
  SHOP_BANNER_POSITION_CATALOG_PERSO,
} from "@/lib/supabase/shop-banners";
import { isSupabaseStoreEnabled } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  try {
    if (isSupabaseStoreEnabled()) {
      const row = await getSupabaseShopBannerByPosition(SHOP_BANNER_POSITION_CATALOG_PERSO);
      if (!row) {
        return NextResponse.json({ error: "Bannière momentanément indisponible." }, { status: 503 });
      }
      const banner = resolveShopCatalogPersoBanner(rowToAdminCatalogPersoBanner(row));
      return NextResponse.json({ banner });
    }
    const store = await loadStoreReadOnly();
    if (!store.catalogPersoBanner) {
      return NextResponse.json({ error: "Bannière momentanément indisponible." }, { status: 503 });
    }
    const banner = resolveShopCatalogPersoBanner(store.catalogPersoBanner);
    return NextResponse.json({ banner });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      return NextResponse.json({ error: "Bannière momentanément indisponible." }, { status: 503 });
    }
    return NextResponse.json({ error: "Bannière momentanément indisponible." }, { status: 503 });
  }
}
