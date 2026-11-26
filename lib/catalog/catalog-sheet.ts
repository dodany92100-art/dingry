/**
 * API publique import feuille catalogue.
 * Implémentation : `lib/catalog/sheet/*`.
 */
export type {
  CatalogSheetFieldKey,
  CatalogSheetRow,
  CatalogSheetRowIssue,
  CatalogSheetParseSummary,
  CatalogSheetModelGroup,
  CatalogSheetCrmCandidate,
} from "@/lib/catalog/sheet/types";

export {
  catalogSheetFieldLabel,
  catalogSheetParseSummary,
  catalogSheetSummaryHeadline,
  formatCatalogSheetIssueLine,
} from "@/lib/catalog/sheet/diagnostics";

export { compactCatalogSheetHeaderKey, normalizeCatalogSheetHeader } from "@/lib/catalog/sheet/headers";

export {
  normalizeCatalogSheetSku,
  parseCatalogSheetUnitPrice,
  catalogDisplaySizeToSkuTaille,
  skuTailleToCatalogDisplaySize,
} from "@/lib/catalog/sheet/normalize";

export { parseCatalogSheetRow } from "@/lib/catalog/sheet/parse-row";
export { parseCatalogSheetCsv, parseCatalogSheetJson } from "@/lib/catalog/sheet/parse-io";

export {
  groupCatalogSheetByModelRef,
  catalogSheetCrmCandidates,
  catalogSheetPrimarySku,
  catalogSheetImportKey,
  catalogSheetCandidateToAdminDraft,
} from "@/lib/catalog/sheet/candidates";
