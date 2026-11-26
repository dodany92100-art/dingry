import type { AdminProduct } from "@/lib/admin/types";
import {
  catalogSheetPrimarySku,
  type CatalogSheetCrmCandidate,
} from "@/lib/catalog/catalog-sheet";
import {
  type CatalogSheetMergeTextMode,
  findAdminProductForCatalogCandidate,
  planCatalogSheetPersist,
} from "@/lib/catalog/catalog-sheet-persist";
import {
  nextSupabaseProductId,
  syncProductOptionsFromDeclinations,
} from "@/lib/supabase/admin-products";
import { adminProductToRow } from "@/lib/supabase/product-row";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { CatalogSheetApplyReport } from "@/lib/admin/apply-catalog-sheet-import-types";
import {
  applyUpdateToProduct,
  buildDraftProductFromPlan,
  buildReportSkeleton,
  recordPlanOutcome,
} from "@/lib/admin/apply-catalog-sheet-import-helpers";

async function persistCatalogSheetSupabaseBatch(toUpsert: readonly AdminProduct[]): Promise<void> {
  if (toUpsert.length === 0) return;
  const { error } = await supabaseAdmin()
    .from("products")
    .upsert(toUpsert.map((product) => adminProductToRow(product)), { onConflict: "id" });
  if (error) throw new Error(error.message);
  for (const product of toUpsert) {
    await syncProductOptionsFromDeclinations({
      productId: product.id,
      productName: product.name,
      parentSku: product.sku,
      category: product.category,
      variant: product.variant,
      colorDeclinations: product.colorDeclinations,
    });
  }
}

export async function applyCatalogSheetSupabase(
  input: {
    candidates: readonly CatalogSheetCrmCandidate[];
    dryRun: boolean;
    mergeText: CatalogSheetMergeTextMode;
  },
  dry: ReturnType<typeof planCatalogSheetPersist>,
  candidateByKey: Map<string, CatalogSheetCrmCandidate>,
  catalogProducts: AdminProduct[],
): Promise<CatalogSheetApplyReport> {
  const report = buildReportSkeleton(input.dryRun, dry);
  let products = [...catalogProducts];

  if (input.dryRun) {
    for (const plan of dry.plans) {
      recordPlanOutcome(report, plan, true);
    }
    return report;
  }

  const toUpsert: AdminProduct[] = [];

  for (const plan of dry.plans) {
    const candidate = candidateByKey.get(plan.importKey);
    if (!candidate) {
      report.errors.push({ importKey: plan.importKey, message: "Fiche CRM introuvable pour ce plan." });
      continue;
    }

    try {
      if (plan.action === "noop") {
        recordPlanOutcome(report, plan, false);
        continue;
      }

      if (plan.action === "create") {
        const id = await nextSupabaseProductId(products);
        const created = buildDraftProductFromPlan(id, candidate, plan, input.candidates);
        toUpsert.push(created);
        report.created.push({
          importKey: plan.importKey,
          productId: id,
          primarySku: catalogSheetPrimarySku(candidate),
        });
        products = [created, ...products];
        continue;
      }

      const existing =
        (plan.productId ? products.find((p) => p.id === plan.productId) : undefined) ??
        findAdminProductForCatalogCandidate(products, candidate);
      if (!existing) {
        report.errors.push({
          importKey: plan.importKey,
          message: "Produit existant introuvable pour mise à jour.",
        });
        continue;
      }

      const saved = applyUpdateToProduct(existing, candidate, plan, input.candidates, input.mergeText);
      toUpsert.push(saved);
      products = products.map((p) => (p.id === saved.id ? saved : p));
      report.updated.push({
        importKey: plan.importKey,
        productId: saved.id,
        primarySku: catalogSheetPrimarySku(candidate),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue.";
      report.errors.push({ importKey: plan.importKey, message });
    }
  }

  if (toUpsert.length > 0) {
    await persistCatalogSheetSupabaseBatch(toUpsert);
  }

  return report;
}