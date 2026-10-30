import { assertCronAuthorized } from "@/lib/cron-auth";
import { jsonNoStore } from "@/lib/http";
import { reconcilePendingStockOrders } from "@/lib/order-stock-finalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Plusieurs commandes × Redis + Blob dans un même passage. */
export const maxDuration = 60;

async function handleStockReconcile(_request: Request) {
  const auth = assertCronAuthorized(_request);
  if (!auth.ok) {
    return jsonNoStore({ error: auth.error }, { status: auth.status });
  }

  try {
    const result = await reconcilePendingStockOrders();
    return jsonNoStore({
      ok: true,
      processed: result.processed,
      applied: result.applied,
      short: result.short,
      stillPending: result.stillPending,
      skippedNoLines: result.skippedNoLines,
      timedOut: result.timedOut,
    });
  } catch (error) {
    console.error("[cron] stock-reconcile", error instanceof Error ? error.name : typeof error);
    return jsonNoStore({ error: "Réconciliation indisponible." }, { status: 503 });
  }
}

/** Déclencheur manuel ou CI. */
export async function POST(request: Request) {
  return handleStockReconcile(request);
}

/**
 * Vercel Cron appelle en GET avec `Authorization: Bearer $CRON_SECRET`.
 * Ne pas lier cette URL dans l’UI.
 */
export async function GET(request: Request) {
  return handleStockReconcile(request);
}
