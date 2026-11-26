import type { AdminProduct } from "@/lib/admin/types";
import type { CatalogSheetCrmCandidate } from "@/lib/catalog/catalog-sheet";
import { catalogSheetImportKey } from "@/lib/catalog/catalog-sheet";
import { getModelRef, isValidSku, normalizeSkuStrict, parseSku } from "@/lib/sku";
import { catalogSheetColorsEquivalent } from "@/lib/catalog/sheet/persist/color-label";

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
      catalogSheetColorsEquivalent(p.variant, candidate.color),
  );
}