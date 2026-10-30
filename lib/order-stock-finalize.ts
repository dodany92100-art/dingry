import { patchOrder } from "@/lib/admin/store";
import type { AdminOrder } from "@/lib/admin/types";
import {
  alertStockVerification,
  applyCheckoutStock,
  type StockLine,
} from "@/lib/stock";

export const RECONCILE_BATCH_LIMIT = 50;
/** Marge avant la coupure Vercel (`maxDuration` 60 s sur la route). */
export const RECONCILE_DEADLINE_MS = 45_000;

export function stockPatchAfterApply(current: AdminOrder): Partial<AdminOrder> {
  if (!current.stockPending) return {};
  return {
    stockPending: false,
    stockApplied: true,
  };
}

export function stockPatchAfterShort(current: AdminOrder): Partial<AdminOrder> {
  if (!current.stockPending) return {};
  if (current.status !== "En attente") {
    return { stockPending: false, stockApplied: false };
  }
  return {
    stockPending: false,
    stockApplied: false,
    status: "À vérifier",
  };
}

export function isStockReconcileCandidate(order: AdminOrder): boolean {
  if (!order.stockPending || order.stockApplied) return false;
  if (order.status === "À vérifier") return false;
  return (order.stockLines?.length ?? 0) > 0;
}

function linesForOrder(order: AdminOrder): StockLine[] {
  return order.stockLines ?? [];
}

/** Finalise le décrément Redis (client, webhook ou cron). */
export async function finalizeOrderStock(order: AdminOrder): Promise<AdminOrder> {
  if (!order.stockPending || order.stockApplied) {
    return order;
  }

  const lines = linesForOrder(order);
  if (lines.length === 0) {
    console.error("[stock] lignes manquantes pour commande", order.id);
    return order;
  }

  const result = await applyCheckoutStock(order.id, lines);

  if (result === "applied") {
    const { order: patched } = await patchOrder(order.id, (current) => stockPatchAfterApply(current));
    return patched ?? order;
  }

  if (result === "short") {
    const { order: patched, changed } = await patchOrder(order.id, (current) =>
      stockPatchAfterShort(current),
    );
    const next = patched ?? order;
    if (changed) {
      alertStockVerification(order.id, "short");
    }
    return next;
  }

  alertStockVerification(order.id, "unavailable");
  return order;
}

export async function reconcilePendingStockOrders(options?: {
  limit?: number;
  deadlineMs?: number;
}): Promise<{
  scanned: number;
  processed: number;
  applied: number;
  short: number;
  stillPending: number;
  skippedNoLines: number;
  timedOut: boolean;
}> {
  const limit = Math.min(
    Math.max(1, options?.limit ?? RECONCILE_BATCH_LIMIT),
    RECONCILE_BATCH_LIMIT,
  );
  const deadline = Date.now() + (options?.deadlineMs ?? RECONCILE_DEADLINE_MS);

  const { listOrders } = await import("@/lib/admin/orders");
  const orders = await listOrders();
  const pending = orders.filter((order) => order.stockPending && !order.stockApplied);
  const withLines = pending.filter((order) => isStockReconcileCandidate(order));
  const skippedNoLines = pending.length - withLines.length;

  if (skippedNoLines > 0) {
    console.error("[cron] stock-reconcile missing-lines", { skippedNoLines });
  }

  const batch = withLines.slice(0, limit);
  let applied = 0;
  let short = 0;
  let processed = 0;
  let timedOut = false;

  for (const order of batch) {
    if (Date.now() > deadline) {
      timedOut = true;
      break;
    }
    processed += 1;
    const beforePending = order.stockPending;
    const beforeApplied = order.stockApplied;
    const after = await finalizeOrderStock(order);
    if (beforePending && !after.stockPending) {
      if (after.stockApplied && !beforeApplied) applied += 1;
      else if (!after.stockApplied) short += 1;
    }
  }

  const afterOrders = await listOrders();
  const stillPending = afterOrders.filter(
    (order) => order.stockPending && !order.stockApplied,
  ).length;

  if (timedOut) {
    console.error("[cron] stock-reconcile timed-out", {
      processed,
      applied,
      short,
      stillPending,
      skippedNoLines,
    });
  }

  if (stillPending > 0) {
    console.error("[cron] stock-reconcile backlog", {
      stillPending,
      applied,
      short,
      processed,
      skippedNoLines,
      timedOut,
    });
  }

  return {
    scanned: pending.length,
    processed,
    applied,
    short,
    stillPending,
    skippedNoLines,
    timedOut,
  };
}
