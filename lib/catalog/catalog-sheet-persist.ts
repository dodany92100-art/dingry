import type { ProductInput } from "@/lib/admin/store";
import {
  DEFAULT_PRODUCT_BRAND,
  DEFAULT_PRODUCT_COLLECTION,
  type AdminProduct,
  type ProductSize,
} from "@/lib/admin/types";
import {
  catalogSheetCandidateToAdminDraft,
  catalogSheetImportKey,
  catalogSheetPrimarySku,
  type CatalogSheetCrmCandidate,
} from "@/lib/catalog/catalog-sheet";
import { getModelRef, isValidSku, normalizeSkuStrict, parseSku } from "@/lib/sku";

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

const NON_PERSISTED_SHEET_FIELDS = ["gender"] as const;

function normalizeColorLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function colorsEquivalent(a: string, b: string): boolean {
  return normalizeColorLabel(a) === normalizeColorLabel(b);
}

function candidateSkuSet(candidate: CatalogSheetCrmCandidate): Set<string> {
  const set = new Set<string>();
  for (const sku of candidate.variantSkus) set.add(normalizeSkuStrict(sku));
  for (const sku of Object.values(candidate.skuBySize)) set.add(normalizeSkuStrict(sku));
  return set;
}

function productMatchesImportKey(product: AdminProduct, importKey: string): boolean {
  const sku = normalizeSkuStrict(product.sku);
  if (!isValidSku(sku)) return false;
  const parsed = parseSku(sku);
  if (!parsed) return false;
  const productKey = `${product.brand}::${getModelRef(sku)}::${parsed.coloris}`;
  return productKey === importKey;
}

/** Résolution idempotente d’une fiche CRM existante (SKU variante ou clé modèle+coloris). */
export function findAdminProductForCatalogCandidate(
  products: readonly AdminProduct[],
  candidate: CatalogSheetCrmCandidate,
): AdminProduct | undefined {
  const skus = candidateSkuSet(candidate);
  const importKey = catalogSheetImportKey(candidate);

  const bySku = products.find((p) => skus.has(normalizeSkuStrict(p.sku)));
  if (bySku) return bySku;

  const byKey = products.find((p) => productMatchesImportKey(p, importKey));
  if (byKey) return byKey;

  return products.find(
    (p) =>
      p.brand === candidate.brand &&
      getModelRef(p.sku) === candidate.modelRef &&
      colorsEquivalent(p.variant, candidate.color),
  );
}

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

function unionColorDeclinations(existing: readonly string[], incoming: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const label of [...existing, ...incoming]) {
    const key = normalizeColorLabel(label);
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
    (label) => !colorsEquivalent(label, candidate.color),
  );
  return siblings;
}

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