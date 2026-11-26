import type { ProductInput } from "@/lib/admin/store";
import { DEFAULT_PRODUCT_BRAND, DEFAULT_PRODUCT_COLLECTION, type AdminProduct, type ProductSize } from "@/lib/admin/types";
import type { CatalogSheetCrmCandidate } from "@/lib/catalog/catalog-sheet";
import {
  catalogSheetCandidateToAdminDraft,
  catalogSheetPrimarySku,
} from "@/lib/catalog/catalog-sheet";
import type { CatalogSheetMergeTextMode } from "@/lib/catalog/sheet/persist/types";
import {
  catalogSheetColorLabelKey,
  catalogSheetColorsEquivalent,
} from "@/lib/catalog/sheet/persist/color-label";
import { normalizeSkuStrict } from "@/lib/sku";

function unionSizes(existing: readonly ProductSize[], incoming: readonly ProductSize[]): ProductSize[] {
  const seen = new Set<string>();
  const out: ProductSize[] = [];
  for (const size of [...existing, ...incoming]) {
    const key = String(size);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(size);
  }
  return out;
}

export function unionColorDeclinations(existing: readonly string[], incoming: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const label of [...existing, ...incoming]) {
    const key = catalogSheetColorLabelKey(label);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(label.trim());
  }
  return out;
}

function mergeTextField(
  current: string,
  incoming: string,
  mode: CatalogSheetMergeTextMode,
): string | undefined {
  const next = incoming.trim();
  if (!next) return undefined;
  const prev = current.trim();
  if (mode === "overwrite" || !prev) return next;
  return undefined;
}

export function mergeCatalogImportIntoProduct(
  existing: AdminProduct,
  candidate: CatalogSheetCrmCandidate,
  mode: CatalogSheetMergeTextMode,
): Partial<ProductInput> & { colorDeclinations?: string[] } {
  const draft = catalogSheetCandidateToAdminDraft(candidate);
  const primarySku = catalogSheetPrimarySku(candidate);
  const fields: Partial<ProductInput> & { colorDeclinations?: string[] } = {};

  const mergedSizes = unionSizes(existing.sizes, draft.sizes);
  const sizesChanged =
    mergedSizes.length !== existing.sizes.length ||
    mergedSizes.some((size, idx) => String(size) !== String(existing.sizes[idx]));
  if (sizesChanged) fields.sizes = mergedSizes;

  if (normalizeSkuStrict(existing.sku) !== normalizeSkuStrict(primarySku)) {
    fields.sku = primarySku;
  }
  if (existing.price !== draft.price) fields.price = draft.price;
  if (existing.category !== draft.category) fields.category = draft.category;
  if (existing.brand !== draft.brand) fields.brand = draft.brand;
  if (existing.name.trim() !== draft.name.trim() && (mode === "overwrite" || !existing.name.trim())) {
    fields.name = draft.name;
  }
  if (
    existing.variant.trim() !== draft.variant.trim() &&
    (mode === "overwrite" || !existing.variant.trim())
  ) {
    fields.variant = draft.variant;
  }

  const description = mergeTextField(existing.description, draft.description, mode);
  if (description !== undefined) fields.description = description;
  const materials = mergeTextField(existing.materials, draft.materials, mode);
  if (materials !== undefined) fields.materials = materials;
  const fabrication = mergeTextField(existing.fabrication, draft.fabrication, mode);
  if (fabrication !== undefined) fields.fabrication = fabrication;
  const limitedEdition = mergeTextField(existing.limitedEdition, draft.limitedEdition, mode);
  if (limitedEdition !== undefined) fields.limitedEdition = limitedEdition;

  return fields;
}

export function catalogSheetImportProductInput(
  candidate: CatalogSheetCrmCandidate,
): ProductInput {
  const draft = catalogSheetCandidateToAdminDraft(candidate);
  return {
    sku: draft.sku,
    name: draft.name,
    variant: draft.variant,
    description: draft.description,
    fabrication: draft.fabrication,
    limitedEdition: draft.limitedEdition,
    materials: draft.materials,
    sizeGuide: "",
    category: draft.category,
    brand: draft.brand ?? DEFAULT_PRODUCT_BRAND,
    collection: DEFAULT_PRODUCT_COLLECTION,
    price: draft.price,
    sizes: draft.sizes,
    stock: 0,
    publishStatus: "draft",
    colorDeclinations: [],
  };
}

function modelRefColorLabels(candidates: readonly CatalogSheetCrmCandidate[], modelRef: string): string[] {
  const labels = new Set<string>();
  for (const c of candidates) {
    if (c.modelRef !== modelRef) continue;
    const label = c.color.trim();
    if (label) labels.add(label);
  }
  return [...labels].sort((a, b) => a.localeCompare(b, "fr"));
}

export function colorDeclinationsForCandidate(
  candidate: CatalogSheetCrmCandidate,
  allCandidates: readonly CatalogSheetCrmCandidate[],
): string[] {
  const siblings = modelRefColorLabels(allCandidates, candidate.modelRef).filter(
    (label) => !catalogSheetColorsEquivalent(label, candidate.color),
  );
  return siblings;
}
