"use server";

import { revalidateShopCatalog } from "@/lib/revalidate-shop-catalog";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { normalizeDropBatchItems, type DropBatchItem } from "@/lib/admin/drop-batch";
import {
  applyAdminDropBatch,
  StoreConflictError,
  StoreUnavailableError,
} from "@/lib/admin/store";
import type { AdminProduct } from "@/lib/admin/types";

export type PublishDropBatchResult =
  | {
      ok: true;
      products: AdminProduct[];
      publishedIds: string[];
      skipped: { id: string; reason: string }[];
    }
  | { ok: false; error: string; skipped?: { id: string; reason: string }[] };

/** Drop CRM : ordre + statuts publiés en une transaction store, cache boutique invalidé une fois. */
export async function publishDropBatchAction(
  items: DropBatchItem[],
): Promise<PublishDropBatchResult> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Non autorisé." };
  }

  const normalized = normalizeDropBatchItems(items);
  if (!normalized) {
    return { ok: false, error: "Lot invalide." };
  }

  try {
    const result = await applyAdminDropBatch(normalized);
    if (!result) {
      return {
        ok: false,
        error: "Synchronisation catalogue impossible. Rechargez l’admin puis réessayez, ou Réinitialiser.",
      };
    }

    const wantsPublish = normalized.some((item) => item.status === "published");
    if (wantsPublish && result.publishedIds.length === 0) {
      const detail =
        result.skipped.length > 0
          ? result.skipped.map((item) => `${item.id}: ${item.reason}`).join(" · ")
          : "Aucun brouillon publiable.";
      return { ok: false, error: detail, skipped: result.skipped };
    }

    revalidateShopCatalog();

    return {
      ok: true,
      products: result.products,
      publishedIds: result.publishedIds,
      skipped: result.skipped,
    };
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      return { ok: false, error: "Enregistrement indisponible." };
    }
    if (error instanceof StoreConflictError) {
      return { ok: false, error: "Conflit d'enregistrement. Réessayez." };
    }
    console.error("publishDropBatchAction", error instanceof Error ? error.name : "erreur");
    return { ok: false, error: "Mise à jour impossible." };
  }
}
