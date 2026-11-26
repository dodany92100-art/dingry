import { isSupabaseStoreEnabled } from "@/lib/supabase/server";
import { loadStoreReadOnly } from "@/lib/admin/store";
import {
  catalogSheetImportKey,
  type CatalogSheetCrmCandidate,
} from "@/lib/catalog/catalog-sheet";
import {
  type CatalogSheetMergeTextMode,
  planCatalogSheetPersist,
} from "@/lib/catalog/catalog-sheet-persist";
import { listSupabaseProducts } from "@/lib/supabase/admin-products";
import { revalidateShopCatalog } from "@/lib/revalidate-shop-catalog";
import type { CatalogSheetApplyReport } from "@/lib/admin/apply-catalog-sheet-import-types";
import { applyCatalogSheetLocal } from "@/lib/admin/apply-catalog-sheet-import-local";
import { applyCatalogSheetSupabase } from "@/lib/admin/apply-catalog-sheet-import-supabase";

export type { CatalogSheetApplyReport } from "@/lib/admin/apply-catalog-sheet-import-types";

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