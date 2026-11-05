import { NextResponse } from "next/server";
import { loadStoreReadOnly, StoreUnavailableError } from "@/lib/admin/store";
import { toCatalogProduct } from "@/lib/admin/types";
import { isInStockFromQuantity, readStockQuantities } from "@/lib/stock";

export const runtime = "nodejs";
/** ISR 60 s — Vercel met en cache la réponse, Blob + Redis ne sont appelés qu'une fois par minute. */
export const revalidate = 60;

export async function GET() {
  try {
    const store = await loadStoreReadOnly();
    const catalogRows = store.products
      .map((product) => toCatalogProduct(product))
      .filter((product): product is NonNullable<typeof product> => product !== null);
    const stockById = await readStockQuantities(catalogRows.map((product) => product.id));
    const products = catalogRows.map((catalog) => {
      const live = stockById.get(catalog.id) ?? "missing";
      const inStock = isInStockFromQuantity(live);
      const { stock: _stock, ...publicProduct } = catalog;
      return { ...publicProduct, inStock };
    });
    const removedCatalogIds = (store.removedCatalogIds ?? []).map((id) => Number(id)).filter((id) =>
      Number.isInteger(id),
    );
    return NextResponse.json({ products, removedCatalogIds });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      console.error("Catalogue injoignable", error.name);
      return NextResponse.json({ error: "Catalogue momentanément indisponible." }, { status: 503 });
    }
    console.error("Catalogue injoignable", error instanceof Error ? error.name : "erreur");
    return NextResponse.json({ error: "Catalogue momentanément indisponible." }, { status: 503 });
  }
}
