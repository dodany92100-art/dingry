import { colorLabelToSkuColorisCode, parseSku } from "@/lib/sku";
import type { Brand, ProductCategory, ProductSize } from "@/lib/admin/types";
import type {
  CatalogSheetCrmCandidate,
  CatalogSheetModelGroup,
  CatalogSheetRow,
  CatalogSheetRowIssue,
} from "@/lib/catalog/sheet/types";
import { catalogSheetMakeIssue } from "@/lib/catalog/sheet/diagnostics";

export function groupCatalogSheetByModelRef(rows: readonly CatalogSheetRow[]): CatalogSheetModelGroup[] {
  const map = new Map<string, CatalogSheetRow[]>();
  for (const row of rows) {
    const bucket = map.get(row.modelRef) ?? [];
    bucket.push(row);
    map.set(row.modelRef, bucket);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([modelRef, grouped]) => ({ modelRef, rows: grouped }));
}

function colorGroupKey(row: CatalogSheetRow): string {
  const parsed = parseSku(row.sku);
  const coloris = parsed?.coloris ?? colorLabelToSkuColorisCode(row.color) ?? row.color.toUpperCase();
  return `${row.modelRef}::${coloris}`;
}

/** Regroupe en fiches CRM (réf. modèle + coloris), tailles et SKU par taille. */
export function catalogSheetCrmCandidates(rows: readonly CatalogSheetRow[]): {
  candidates: CatalogSheetCrmCandidate[];
  issues: CatalogSheetRowIssue[];
} {
  const map = new Map<string, CatalogSheetRow[]>();
  for (const row of rows) {
    const key = colorGroupKey(row);
    const bucket = map.get(key) ?? [];
    bucket.push(row);
    map.set(key, bucket);
  }

  const candidates: CatalogSheetCrmCandidate[] = [];
  const issues: CatalogSheetRowIssue[] = [];

  for (const [, bucket] of map) {
    const first = bucket[0]!;
    const parsed = parseSku(first.sku);
    const colorisCode = parsed?.coloris ?? colorLabelToSkuColorisCode(first.color);

    const prices = new Set(bucket.map((r) => r.unitPriceEuro));
    if (prices.size > 1) {
      issues.push(
        catalogSheetMakeIssue({
          level: "warning",
          code: "price_spread",
          message: `Prix différents pour ${first.modelRef} / ${first.color} (${[...prices].join(", ")} €).`,
          sku: first.sku,
          modelName: first.modelName,
          field: "unitPrice",
        }),
      );
    }

    const skuBySize: Record<string, string> = {};
    const sizes: ProductSize[] = [];
    for (const row of bucket) {
      const sizeKey = String(row.size);
      if (skuBySize[sizeKey] && skuBySize[sizeKey] !== row.sku) {
        issues.push(
          catalogSheetMakeIssue({
            level: "error",
            code: "duplicate_size",
            message: `Doublon taille ${sizeKey} avec SKU différents.`,
            rowNumber: row.sourceLine,
            sku: row.sku,
            modelName: row.modelName,
            field: "size",
          }),
        );
      }
      skuBySize[sizeKey] = row.sku;
      if (!sizes.includes(row.size)) sizes.push(row.size);
    }

    const storySource =
      bucket.find((r) => r.longDescription.trim().length > 0) ??
      bucket.find((r) => r.shortDescription.trim().length > 0) ??
      first;

    candidates.push({
      modelRef: first.modelRef,
      modelName: first.modelName,
      brand: first.brand,
      category: first.category,
      color: first.color,
      colorisCode,
      unitPriceEuro: first.unitPriceEuro,
      sizes,
      skuBySize,
      gender: first.gender,
      shortDescription: storySource.shortDescription,
      longDescription: storySource.longDescription,
      composition: storySource.composition || first.composition,
      highlights: storySource.highlights || first.highlights,
      variantSkus: bucket.map((r) => r.sku),
    });
  }

  candidates.sort((a, b) =>
    a.modelRef === b.modelRef
      ? a.color.localeCompare(b.color, "fr")
      : a.modelRef.localeCompare(b.modelRef),
  );

  return { candidates, issues };
}

const CATALOG_SIZE_SORT_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "TU", "U"] as const;

function catalogSheetSizeSortIndex(size: string): number {
  const index = CATALOG_SIZE_SORT_ORDER.indexOf(size as (typeof CATALOG_SIZE_SORT_ORDER)[number]);
  return index >= 0 ? index : 99;
}

/** SKU représentatif (taille la plus « centrale » disponible). */
export function catalogSheetPrimarySku(candidate: CatalogSheetCrmCandidate): string {
  const ordered = [...candidate.sizes].sort(
    (a, b) => catalogSheetSizeSortIndex(String(a)) - catalogSheetSizeSortIndex(String(b)),
  );
  for (const size of ordered) {
    const sku = candidate.skuBySize[String(size)];
    if (sku) return sku;
  }
  return candidate.variantSkus[0] ?? candidate.modelRef;
}

/** Clé d’idempotence import : marque + réf. modèle + coloris SKU. */
export function catalogSheetImportKey(candidate: CatalogSheetCrmCandidate): string {
  const coloris = candidate.colorisCode ?? candidate.color.trim().toUpperCase();
  return `${candidate.brand}::${candidate.modelRef}::${coloris}`;
}

/** Projection minimale vers champs admin (sans écriture DB). */
export function catalogSheetCandidateToAdminDraft(candidate: CatalogSheetCrmCandidate): {
  sku: string;
  name: string;
  variant: string;
  brand: Brand;
  category: ProductCategory;
  price: number;
  sizes: ProductSize[];
  description: string;
  materials: string;
  fabrication: string;
  limitedEdition: string;
} {
  return {
    sku: catalogSheetPrimarySku(candidate),
    name: candidate.modelName,
    variant: candidate.color,
    brand: candidate.brand,
    category: candidate.category,
    price: candidate.unitPriceEuro,
    sizes: candidate.sizes,
    description: candidate.longDescription || candidate.shortDescription,
    materials: candidate.composition,
    fabrication: candidate.highlights,
    limitedEdition: candidate.shortDescription,
  };
}
