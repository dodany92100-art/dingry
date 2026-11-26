import type { AdminProduct } from "@/lib/admin/types";
import { DEFAULT_PRODUCT_COLLECTION, DRAFT_PRODUCT_PLACEHOLDER_IMAGE } from "@/lib/admin/types";
import { catalogSheetPrimarySku, type CatalogSheetCrmCandidate } from "@/lib/catalog/catalog-sheet";
import {
  type CatalogSheetMergeTextMode,
  type CatalogSheetPersistPlan,
  catalogSheetImportProductInput,
  colorDeclinationsForCandidate,
  mergeCatalogImportIntoProduct,
  planCatalogSheetPersist,
  unionColorDeclinations,
} from "@/lib/catalog/catalog-sheet-persist";
import type { CatalogSheetApplyReport } from "@/lib/admin/apply-catalog-sheet-import-types";

export function buildReportSkeleton(
  dryRun: boolean,
  dry: ReturnType<typeof planCatalogSheetPersist>,
): CatalogSheetApplyReport {
  return {
    dryRun,
    created: [],
    updated: [],
    unchanged: [],
    errors: [],
    genderPendingSchema: dry.genderPendingSchema,
    unmatchedFields: dry.unmatchedFields,
  };
}

export function recordPlanOutcome(
  report: CatalogSheetApplyReport,
  plan: CatalogSheetPersistPlan,
  dryRun: boolean,
): void {
  if (plan.action === "noop") {
    if (plan.productId) {
      report.unchanged.push({ importKey: plan.importKey, productId: plan.productId });
    }
    return;
  }
  if (dryRun) {
    if (plan.action === "create") {
      report.created.push({ importKey: plan.importKey, primarySku: plan.primarySku });
    } else if (plan.productId) {
      report.updated.push({
        importKey: plan.importKey,
        productId: plan.productId,
        primarySku: plan.primarySku,
      });
    }
  }
}

export function buildDraftProductFromPlan(
  id: string,
  candidate: CatalogSheetCrmCandidate,
  plan: CatalogSheetPersistPlan,
  allCandidates: readonly CatalogSheetCrmCandidate[],
): AdminProduct {
  const input = catalogSheetImportProductInput(candidate);
  const colorDeclinations = plan.colorDeclinations ?? colorDeclinationsForCandidate(candidate, allCandidates);
  const now = new Date().toISOString();
  return {
    id,
    sku: input.sku,
    name: input.name,
    variant: input.variant,
    description: input.description,
    fabrication: input.fabrication,
    limitedEdition: input.limitedEdition,
    materials: input.materials,
    sizeGuide: input.sizeGuide,
    printPlacement: "",
    category: input.category,
    brand: input.brand ?? "FYMA",
    collection: input.collection ?? DEFAULT_PRODUCT_COLLECTION,
    price: input.price,
    sizes: input.sizes,
    stock: 0,
    publishStatus: "draft",
    colorDeclinations,
    imageUrl: DRAFT_PRODUCT_PLACEHOLDER_IMAGE,
    blobUrl: null,
    blobPathname: null,
    imageBackUrl: "",
    imageBackBlobUrl: null,
    imageBackBlobPathname: null,
    createdAt: now,
    isPinned: false,
    displayOrder: 0,
  };
}

export function applyUpdateToProduct(
  existing: AdminProduct,
  candidate: CatalogSheetCrmCandidate,
  plan: CatalogSheetPersistPlan,
  allCandidates: readonly CatalogSheetCrmCandidate[],
  mergeText: CatalogSheetMergeTextMode,
): AdminProduct {
  const declinations = unionColorDeclinations(
    existing.colorDeclinations,
    plan.colorDeclinations ?? colorDeclinationsForCandidate(candidate, allCandidates),
  );
  const mergedFields = {
    ...(plan.fields ?? mergeCatalogImportIntoProduct(existing, candidate, mergeText)),
    colorDeclinations: declinations,
  };
  return {
    ...existing,
    ...mergedFields,
    colorDeclinations: declinations,
  };
}