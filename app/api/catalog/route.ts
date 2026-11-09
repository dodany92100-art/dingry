import { NextResponse } from "next/server";
import { StoreUnavailableError } from "@/lib/admin/store";
import { getCachedCatalogProductRows } from "@/lib/server/shop-catalog-cache";
import { isInStockFromQuantity, readStockQuantities } from "@/lib/stock";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { products: catalogRows, removedCatalogIds } = await getCachedCatalogProductRows();
    const stockById = await readStockQuantities(catalogRows.map((product) => product.id));
    const products = catalogRows.map((catalog) => {
      const live = stockById.get(catalog.id) ?? "missing";
      const inStock = isInStockFromQuantity(live);
      const { stock: _stock, ...publicProduct } = catalog;
      return { ...publicProduct, inStock };
    });
    return NextResponse.json(
      { products, removedCatalogIds },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        },
      },
    );
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      console.error("Catalogue injoignable", error.name);
      return NextResponse.json({ error: "Catalogue momentanément indisponible." }, { status: 503 });
    }
    console.error("Catalogue injoignable", error instanceof Error ? error.name : "erreur");
    return NextResponse.json({ error: "Catalogue momentanément indisponible." }, { status: 503 });
  }
}
