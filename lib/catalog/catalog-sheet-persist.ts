/**
 * API publique planification / persistance import feuille.
 * Implémentation : `lib/catalog/sheet/persist/*`.
 */
export type {
  CatalogSheetMergeTextMode,
  CatalogSheetPersistPlan,
  CatalogSheetPersistDryRunReport,
} from "@/lib/catalog/sheet/persist/types";

export { findAdminProductForCatalogCandidate } from "@/lib/catalog/sheet/persist/resolve";

export {
  mergeCatalogImportIntoProduct,
  catalogSheetImportProductInput,
  colorDeclinationsForCandidate,
  unionColorDeclinations,
} from "@/lib/catalog/sheet/persist/merge";

export {
  compactCatalogCandidatesForWire,
  validateCatalogSheetCandidates,
  planCatalogSheetPersist,
} from "@/lib/catalog/sheet/persist/delta";