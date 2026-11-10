import { NextResponse } from "next/server";
import { loadStoreReadOnly, StoreUnavailableError } from "@/lib/admin/store";
import { resolveShopCatalogPersoBanner } from "@/lib/catalog-perso-banner";
import {
  listSupabaseShopBanners,
  rowToPublicShopBanner,
  SHOP_BANNER_POSITION_CATALOG_PERSO,
} from "@/lib/supabase/shop-banners";
import { isSupabaseStoreEnabled } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  try {
    if (isSupabaseStoreEnabled()) {
      const rows = await listSupabaseShopBanners({ activeOnly: true });
      return NextResponse.json({ banners: rows.map(rowToPublicShopBanner) });
    }
    const store = await loadStoreReadOnly();
    const banners = [];
    if (store.catalogPersoBanner) {
      const banner = resolveShopCatalogPersoBanner(store.catalogPersoBanner);
      if (banner.enabled) {
        banners.push({
          id: SHOP_BANNER_POSITION_CATALOG_PERSO,
          position: SHOP_BANNER_POSITION_CATALOG_PERSO,
          title: banner.title,
          subtitle: banner.subtitle,
          eyebrow: banner.eyebrow,
          ctaLabel: banner.ctaLabel,
          imageUrl: banner.imageUrl,
          linkUrl: "",
        });
      }
    }
    return NextResponse.json({ banners });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      return NextResponse.json({ error: "Bannières momentanément indisponibles." }, { status: 503 });
    }
    return NextResponse.json({ error: "Bannières momentanément indisponibles." }, { status: 500 });
  }
}
