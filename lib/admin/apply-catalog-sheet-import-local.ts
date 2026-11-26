import { createProduct, loadStoreReadOnly, updateProduct } from "@/lib/admin/store";
import type { AdminProduct } from "@/lib/admin/types";
import {
  catalogSheetPrimarySku,
  type CatalogSheetCrmCandidate,
} from "@/lib/catalog/catalog-sheet";
import {
  type CatalogSheetMergeTextMode,
  catalogSheetImportProductInput,
  colorDeclinationsForCandidate,
  findAdminProductForCatalogCandidate,
  mergeCatalogImportIntoProduct,
  planCatalogSheetPersist,
  unionColorDeclinations,
} from "@/lib/catalog/catalog-sheet-persist";
import type { CatalogSheetApplyReport } from "@/lib/admin/apply-catalog-sheet-import-types";
import {
  buildReportSkeleton,
  recordPlanOutcome,
} from "@/lib/admin/apply-catalog-sheet-import-helpers";

export async function applyCatalogSheetLocal(
  input: {
    candidates: readonly CatalogSheetCrmCandidate[];
    dryRun: boolean;
    mergeText: CatalogSheetMergeTextMode;
  },
  dry: ReturnType<typeof planCatalogSheetPersist>,
  candidateByKey: Map<string, CatalogSheetCrmCandidate>,
): Promise<CatalogSheetApplyReport> {
  const report = buildReportSkeleton(input.dryRun, dry);
  const store = await loadStoreReadOnly();
  let products: AdminProduct[] = [...store.products];

  for (const plan of dry.plans) {
    const candidate = candidateByKey.get(plan.importKey);
    if (!candidate) {
      report.errors.push({ importKey: plan.importKey, message: "Fiche CRM introuvable pour ce plan." });
      continue;
    }

    try {
      if (plan.action === "noop") {
        recordPlanOutcome(report, plan, input.dryRun);
        continue;
      }

      if (input.dryRun) {
        recordPlanOutcome(report, plan, true);
        continue;
      }

      if (plan.action === "create") {
        const inputPayload = catalogSheetImportProductInput(candidate);
        const colorDeclinations = plan.colorDeclinations ?? colorDeclinationsForCandidate(candidate, input.candidates);
        const created = await createProduct({
          ...inputPayload,
          colorDeclinations,
          publishStatus: "draft",
        });
        products = [created, ...products.filter((p) => p.id !== created.id)];
        report.created.push({
          importKey: plan.importKey,
          productId: created.id,
          primarySku: catalogSheetPrimarySku(candidate),
        });
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

      const declinations = unionColorDeclinations(
        existing.colorDeclinations,
        plan.colorDeclinations ?? colorDeclinationsForCandidate(candidate, input.candidates),
      );
      const mergedFields = {
        ...(plan.fields ?? mergeCatalogImportIntoProduct(existing, candidate, input.mergeText)),
        colorDeclinations: declinations,
      };

      const saved = await updateProduct(existing.id, mergedFields);
      if (!saved) {
        report.errors.push({
          importKey: plan.importKey,
          message: `Mise à jour impossible (id ${existing.id}).`,
        });
        continue;
      }
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

  return report;
}