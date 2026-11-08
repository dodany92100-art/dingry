export type StockAutosavePhase = "saving" | "saved";

export type StockAutosaveStatusMap = Record<string, StockAutosavePhase>;

export const STOCK_AUTOSAVE_DEBOUNCE_MS = 6000;

export type StockPendingChanges = Record<string, number>;
