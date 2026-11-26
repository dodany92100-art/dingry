import type { ProductInput } from "@/lib/admin/store";

export type CatalogSheetMergeTextMode = "fill-empty" | "overwrite";

export type CatalogSheetPersistPlan = {
  importKey: string;
  primarySku: string;
  action: "create" | "update" | "noop";
  productId?: string;
  fields?: Partial<ProductInput>;
  colorDeclinations?: string[];
  /** `Genre` feuille — non persisté en DB aujourd’hui. */
  gender: string;
};

export type CatalogSheetPersistDryRunReport = {
  plans: CatalogSheetPersistPlan[];
  genderPendingSchema: boolean;
  unmatchedFields: readonly string[];
};