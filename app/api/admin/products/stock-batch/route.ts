import { revalidateShopCatalog } from "@/lib/revalidate-shop-catalog";
import { requireAdmin } from "@/lib/admin/auth";
import {
  ProductStockAdjustError,
  StoreConflictError,
  StoreUnavailableError,
  updateProductStock,
} from "@/lib/admin/store";
import type { AdminProduct } from "@/lib/admin/types";
import { jsonNoStore } from "@/lib/http";

export const runtime = "nodejs";

type StockUpdateRow = { id: string; stock: number };

function parseUpdates(body: unknown): StockUpdateRow[] | { error: string } {
  if (!body || typeof body !== "object") return { error: "Corps JSON invalide." };
  const raw = (body as { updates?: unknown }).updates;
  if (!Array.isArray(raw) || raw.length === 0) return { error: "Aucune modification de stock." };
  if (raw.length > 200) return { error: "Trop de lignes (200 max)." };
  const updates: StockUpdateRow[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") return { error: "Ligne de stock invalide." };
    const id = String((row as { id?: unknown }).id ?? "").trim();
    const stock = (row as { stock?: unknown }).stock;
    if (!id) return { error: "Identifiant produit manquant." };
    if (!Number.isInteger(stock) || (stock as number) < 0 || (stock as number) > 9999) {
      return { error: `Stock invalide pour ${id}.` };
    }
    updates.push({ id, stock: stock as number });
  }
  return updates;
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonNoStore({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const parsed = parseUpdates(body);
  if (!Array.isArray(parsed)) {
    return jsonNoStore({ error: parsed.error }, { status: 400 });
  }

  const products: AdminProduct[] = [];
  const failed: string[] = [];

  try {
    for (const { id, stock } of parsed) {
      try {
        const updated = await updateProductStock(id, stock);
        if (updated) products.push(updated);
        else failed.push(id);
      } catch (error) {
        if (error instanceof ProductStockAdjustError && error.code === "negative") {
          return jsonNoStore({ error: error.message }, { status: 409 });
        }
        failed.push(id);
      }
    }
  } catch (error) {
    if (error instanceof StoreConflictError) {
      return jsonNoStore({ error: "Conflit d'enregistrement. Réessaie dans quelques secondes." }, { status: 409 });
    }
    if (error instanceof StoreUnavailableError) {
      return jsonNoStore({ error: "Stockage indisponible." }, { status: 503 });
    }
    return jsonNoStore({ error: "Enregistrement du stock impossible." }, { status: 500 });
  }

  if (products.length > 0) revalidateShopCatalog();

  if (failed.length > 0 && products.length === 0) {
    return jsonNoStore({ error: "Aucun stock enregistré.", failed }, { status: 500 });
  }

  return jsonNoStore({
    products,
    ...(failed.length > 0 ? { failed } : {}),
  });
}
