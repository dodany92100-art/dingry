import { NextResponse } from "next/server";
import { loadStore } from "@/lib/admin/store";
import { toCatalogProduct } from "@/lib/admin/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = await loadStore();
    const products = store.products
      .map(toCatalogProduct)
      .filter((product): product is NonNullable<typeof product> => product !== null);
    return NextResponse.json(
      { products },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch {
    return NextResponse.json({ products: [] });
  }
}
