import { NextResponse } from "next/server";
import { loadStoreReadOnly, StoreUnavailableError } from "@/lib/admin/store";
import { toCatalogProduct } from "@/lib/admin/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = await loadStoreReadOnly();
    const products = store.products
      .map(toCatalogProduct)
      .filter((product): product is NonNullable<typeof product> => product !== null);
    return NextResponse.json(
      { products },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      console.error("Catalogue injoignable", error.name);
      return NextResponse.json(
        { error: "Catalogue momentanément indisponible." },
        { status: 503, headers: { "Cache-Control": "private, no-store, max-age=0" } },
      );
    }
    console.error("Catalogue injoignable", error instanceof Error ? error.name : typeof error);
    return NextResponse.json(
      { error: "Catalogue momentanément indisponible." },
      { status: 503, headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  }
}
