export type CatalogSheetApplyReport = {
  dryRun: boolean;
  created: { importKey: string; productId?: string; primarySku: string }[];
  updated: { importKey: string; productId: string; primarySku: string }[];
  unchanged: { importKey: string; productId: string }[];
  errors: { importKey: string; message: string }[];
  genderPendingSchema: boolean;
  unmatchedFields: readonly string[];
};