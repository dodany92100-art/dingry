import type { ProductInput } from "@/lib/admin/store";
import type { AdminProduct, ProductSize } from "@/lib/admin/types";
import type { CatalogSheetCrmCandidate } from "@/lib/catalog/catalog-sheet";
import { catalogSheetImportKey, catalogSheetPrimarySku } from "@/lib/catalog/catalog-sheet";
import type { CatalogSheetMergeTextMode, CatalogSheetPersistPlan, CatalogSheetPersistDryRunReport } from "@/lib/catalog/sheet/persist/types";
import {
  colorDeclinationsForCandidate,
  mergeCatalogImportIntoProduct,
  unionColorDeclinations,
} from "@/lib/catalog/sheet/persist/merge";
import { findAdminProductForCatalogCandidate } from "@/lib/catalog/sheet/persist/resolve";

const NON_PERSISTED_SHEET_FIELDS = ["gender"] as const;

function arraysEqualStrings<T extends string>(a: readonly T[], b: readonly T[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => String(value) === String(b[index]));
}

/** Aucune écriture DB utile si le patch fusionné est vide ou redondant avec l'existant. */
function catalogSheetPersistPatchIsNoop(
  existing: AdminProduct,
  patch: Partial<ProductInput> & { colorDeclinations?: string[] },
): boolean {
  for (const key of Object.keys(patch) as (keyof typeof patch)[]) {
    const value = patch[key];
    if (value === undefined) continue;
    if (key === "colorDeclinations") {
      const next = value as string[];
      if (!arraysEqualStrings(existing.colorDeclinations, next)) return false;
      continue;
    }
    if (key === "sizes") {
      const next = value as ProductSize[];
      if (!arraysEqualStrings(existing.sizes, next)) return false;
      continue;
    }
    if (key === "price") {
      if (existing.price !== value) return false;
      continue;
    }
    const current = existing[key as keyof AdminProduct];
    if (typeof value === "string" && typeof current === "string") {
      if (current.trim() !== (value as string).trim()) return false;
      continue;
    }
    if (current !== value) return false;
  }
  return true;
}

/** Payload réseau compact (champs texte trim, pas de sur-colonnes). */
function compactCatalogSheetCandidate(candidate: CatalogSheetCrmCandidate): CatalogSheetCrmCandidate {
  const trim = (value: string) => value.trim();
  return {
    modelRef: trim(candidate.modelRef),
    modelName: trim(candidate.modelName),
    brand: candidate.brand,
    category: candidate.category,
    color: trim(candidate.color),
    colorisCode: candidate.colorisCode,
    unitPriceEuro: candidate.unitPriceEuro,
    sizes: [...candidate.sizes],
    skuBySize: { ...candidate.skuBySize },
    gender: trim(candidate.gender),
    shortDescription: trim(candidate.shortDescription),
    longDescription: trim(candidate.longDescription),
    composition: trim(candidate.composition),
    highlights: trim(candidate.highlights),
    variantSkus: candidate.variantSkus.map(trim),
  };
}

export function compactCatalogCandidatesForWire(
  candidates: readonly CatalogSheetCrmCandidate[],
): CatalogSheetCrmCandidate[] {
  return candidates.map(compactCatalogSheetCandidate);
}

export function validateCatalogSheetCandidates(
  candidates: readonly CatalogSheetCrmCandidate[],
): { ok: true } | { ok: false; message: string } {
  if (candidates.length === 0) {
    return { ok: false, message: "Aucune fiche CRM à importer." };
  }
  for (const candidate of candidates) {
    if (!candidate.modelRef.trim() || !candidate.color.trim()) {
      return { ok: false, message: "Fiche invalide : réf. modèle et coloris requis." };
    }
    const primary = catalogSheetPrimarySku(candidate);
    if (!primary) {
      return { ok: false, message: `Fiche invalide (${candidate.modelRef}) : SKU principal manquant.` };
    }
  }
  return { ok: true };
}

export function planCatalogSheetPersist(
  products: readonly AdminProduct[],
  candidates: readonly CatalogSheetCrmCandidate[],
  options?: { mergeText?: CatalogSheetMergeTextMode },
): CatalogSheetPersistDryRunReport {
  const mode = options?.mergeText ?? "fill-empty";
  const plans: CatalogSheetPersistPlan[] = [];

  for (const candidate of candidates) {
    const existing = findAdminProductForCatalogCandidate(products, candidate);
    const colorDeclinations = colorDeclinationsForCandidate(candidate, candidates);
    const gender = candidate.gender.trim();
    const importKey = catalogSheetImportKey(candidate);
    const primarySku = catalogSheetPrimarySku(candidate);

    if (!existing) {
      plans.push({
        importKey,
        primarySku,
        action: "create",
        colorDeclinations,
        gender,
      });
      continue;
    }

    const merged = mergeCatalogImportIntoProduct(existing, candidate, mode);
    const nextDeclinations = unionColorDeclinations(existing.colorDeclinations, colorDeclinations);
    const declinationsChanged =
      nextDeclinations.length !== existing.colorDeclinations.length ||
      nextDeclinations.some((c, idx) => c !== existing.colorDeclinations[idx]);
    if (declinationsChanged) {
      merged.colorDeclinations = nextDeclinations;
    }

    const hasFieldChanges =
      Object.keys(merged).length > 0 && !catalogSheetPersistPatchIsNoop(existing, merged);
    plans.push({
      importKey,
      primarySku,
      action: hasFieldChanges ? "update" : "noop",
      productId: existing.id,
      fields: hasFieldChanges ? merged : undefined,
      colorDeclinations: merged.colorDeclinations,
      gender,
    });
  }

  return {
    plans,
    genderPendingSchema: candidates.some((c) => c.gender.trim().length > 0),
    unmatchedFields: NON_PERSISTED_SHEET_FIELDS,
  };
}
