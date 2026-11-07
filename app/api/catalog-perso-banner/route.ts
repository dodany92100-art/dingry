import { NextResponse } from "next/server";
import { loadStoreReadOnly, StoreUnavailableError } from "@/lib/admin/store";
import { resolveShopCatalogPersoBanner } from "@/lib/catalog-perso-banner";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  try {
    const store = await loadStoreReadOnly();
    const banner = resolveShopCatalogPersoBanner(store.catalogPersoBanner);
    return NextResponse.json({ banner });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      return NextResponse.json({ error: "Bannière momentanément indisponible." }, { status: 503 });
    }
    return NextResponse.json({ error: "Bannière momentanément indisponible." }, { status: 500 });
  }
}
