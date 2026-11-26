import { isSupabaseStoreEnabled } from "@/lib/supabase/server";
import { createProduct, loadStoreReadOnly, updateProduct } from "@/lib/admin/store";
import type { AdminProduct } from "@/lib/admin/types";
import {
  catalogSheetImportKey,
  catalogSheetPrimarySku,
  type CatalogSheetCrmCandidate,
} from "@/lib/catalog/catalog-sheet";
import {
  type CatalogSheetMergeTextMode,
  type CatalogSheetPersistPlan,
  catalogSheetImportProductInput,
  colorDeclinationsForCandidate,
  findAdminProductForCatalogCandidate,
  mergeCatalogImportIntoProduct,
  planCatalogSheetPersist,
} from "@/lib/catalog/catalog-sheet-persist";
import { DEFAULT_PRODUCT_COLLECTION, DRAFT_PRODUCT_PLACEHOLDER_IMAGE } from "@/lib/admin/types";
import {
  listSupabaseProducts,
  nextSupabaseProductId,
  syncProductOptionsFromDeclinations,
} from "@/lib/supabase/admin-products";
import { adminProductToRow } from "@/lib/supabase/product-row";
import { supabaseAdmin } from "@/lib/supabase/server";
import { revalidateShopCatalog } from "@/lib/revalidate-shop-catalog";

export type CatalogSheetApplyReport = {
  dryRun: boolean;
  created: { importKey: string; productId?: string; primarySku: string }[];
  updated: { importKey: string; productId: string; primarySku: string }[];
  unchanged: { importKey: string; productId: string }[];
  errors: { importKey: string; message: string }[];
  genderPendingSchema: boolean;
  unmatchedFields: readonly string[];
};

function unionColorDeclinations(existing: readonly string[], incoming: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const normalize = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "");
  for (const label of [...existing, ...incoming]) {
    const key = normalize(label);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(label.trim());
  }
  return out;
}

function buildReportSkeleton(
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

function recordPlanOutcome(
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

function buildDraftProductFromPlan(
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

function applyUpdateToProduct(
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

async function applyCatalogSheetSupabase(
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

async function applyCatalogSheetLocal(
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

export async function applyCatalogSheetImport(input: {
  candidates: readonly CatalogSheetCrmCandidate[];
  dryRun?: boolean;
  mergeText?: CatalogSheetMergeTextMode;
}): Promise<CatalogSheetApplyReport> {
  const dryRun = input.dryRun === true;
  const mergeText = input.mergeText ?? "fill-empty";
  const catalogProducts = isSupabaseStoreEnabled()
    ? await listSupabaseProducts()
    : (await loadStoreReadOnly()).products;
  const dry = planCatalogSheetPersist(catalogProducts, input.candidates, { mergeText });

  const candidateByKey = new Map(
    input.candidates.map((c) => [catalogSheetImportKey(c), c] as const),
  );

  const report = isSupabaseStoreEnabled()
    ? await applyCatalogSheetSupabase(
        { candidates: input.candidates, dryRun, mergeText },
        dry,
        candidateByKey,
        catalogProducts,
      )
    : await applyCatalogSheetLocal(
        { candidates: input.candidates, dryRun, mergeText },
        dry,
        candidateByKey,
      );

  if (!dryRun && (report.created.length > 0 || report.updated.length > 0)) {
    revalidateShopCatalog();
  }

  return report;
}