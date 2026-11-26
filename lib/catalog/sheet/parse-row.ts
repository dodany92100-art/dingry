import { categoryToSkuTypeCode, colorLabelToSkuColorisCode, getModelRef, isValidSku, parseSku } from "@/lib/sku";
import { normalizeProductCategory, type ProductCategory, type ProductSize } from "@/lib/admin/types";
import type { CatalogSheetFieldKey, CatalogSheetRow, CatalogSheetRowIssue } from "@/lib/catalog/sheet/types";
import { CATALOG_SHEET_FIELD_KEYS, normalizeCatalogSheetHeader } from "@/lib/catalog/sheet/headers";
import {
  catalogDisplaySizeToSkuTaille,
  normalizeCatalogSheetBrand,
  normalizeCatalogSheetCodeToken,
  normalizeCatalogSheetColorDisplay,
  normalizeCatalogSheetModelRef,
  normalizeCatalogSheetSku,
  parseCatalogSheetUnitPrice,
  skuTailleToCatalogDisplaySize,
} from "@/lib/catalog/sheet/normalize";
import { catalogSheetMakeIssue } from "@/lib/catalog/sheet/diagnostics";

function cellString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeRecordKeys(
  raw: Record<string, unknown>,
): Partial<Record<CatalogSheetFieldKey, string>> {
  const out: Partial<Record<CatalogSheetFieldKey, string>> = {};
  for (const [key, value] of Object.entries(raw)) {
    const field =
      normalizeCatalogSheetHeader(key) ??
      (CATALOG_SHEET_FIELD_KEYS.has(key) ? (key as CatalogSheetFieldKey) : null);
    if (!field) continue;
    const next = cellString(value);
    if (!next && out[field]) continue;
    out[field] = next;
  }
  return out;
}

function isSkippableSheetRow(fields: Partial<Record<CatalogSheetFieldKey, string>>): boolean {
  const sku = fields.sku?.trim() ?? "";
  const name = fields.modelName?.trim() ?? "";
  if (!sku && !name) return true;
  const noise = new Set(["catalogue", "catalog", "inventaire", "stock"]);
  const blob = `${sku} ${name}`.trim().toLowerCase();
  return blob.length > 0 && blob.length < 24 && noise.has(blob);
}

export function parseCatalogSheetRow(
  raw: Record<string, unknown>,
  options?: { sourceLine?: number },
): { row: CatalogSheetRow | null; issues: CatalogSheetRowIssue[] } {
  const fields = normalizeRecordKeys(raw);
  if (isSkippableSheetRow(fields)) {
    return { row: null, issues: [] };
  }

  const issues: CatalogSheetRowIssue[] = [];
  const rowNumber = options?.sourceLine;
  const modelNameDraft = cellString(fields.modelName);
  const skuDraft = normalizeCatalogSheetSku(fields.sku ?? "") || cellString(fields.sku);

  const pushIssue = (
    level: CatalogSheetRowIssue["level"],
    code: string,
    message?: string,
    ctx?: { sku?: string; modelName?: string; field?: CatalogSheetFieldKey | "" },
  ) => {
    issues.push(
      catalogSheetMakeIssue({
        level,
        code,
        message,
        rowNumber,
        sku: ctx?.sku ?? skuDraft,
        modelName: ctx?.modelName ?? modelNameDraft,
        field: ctx?.field,
      }),
    );
  };

  const pushError = (code: string, message?: string, field?: CatalogSheetFieldKey | "") => {
    pushIssue("error", code, message, { field });
  };

  const skuRaw = fields.sku ?? "";
  const sku = normalizeCatalogSheetSku(skuRaw);
  const skuToken = normalizeCatalogSheetCodeToken(skuRaw);
  if (skuRaw.trim() && skuToken.endsWith("-TU") && sku.endsWith("-U")) {
    pushIssue("warning", "sku_taille_tu_normalized", undefined, { sku, field: "sku" });
  }

  const brandRaw = fields.brand ?? "";
  const brand = normalizeCatalogSheetBrand(brandRaw, sku);
  if (!brand) pushError("brand_missing", undefined, "brand");

  if (!sku) pushError("sku_missing", undefined, "sku");
  else if (!isValidSku(sku)) {
    pushError("sku_invalid", `SKU invalide après normalisation : « ${sku} ».`, "sku");
  }

  const modelRefRaw = fields.modelRef ?? "";
  let modelRef = modelRefRaw ? normalizeCatalogSheetModelRef(modelRefRaw) : "";
  if (!modelRef && sku) {
    modelRef = getModelRef(sku) ?? "";
    if (!modelRefRaw.trim() && modelRef) {
      pushIssue("warning", "model_ref_inferred", `Réf. modèle déduite du SKU : ${modelRef}.`, {
        sku,
        field: "modelRef",
      });
    }
  }
  if (!modelRef) pushError("model_ref_missing", undefined, "modelRef");
  else if (sku && getModelRef(sku) && getModelRef(sku) !== modelRef) {
    pushError(
      "model_ref_sku_mismatch",
      `Réf. modèle « ${modelRef} » ≠ réf. dérivée du SKU (${getModelRef(sku)}).`,
      "modelRef",
    );
  }

  const unitPriceEuro = parseCatalogSheetUnitPrice(fields.unitPrice ?? "");
  if (unitPriceEuro === null) {
    pushError("price_invalid", `PrixU illisible : « ${fields.unitPrice ?? ""} ».`, "unitPrice");
  }

  const categoryRaw = fields.category ?? "";
  const category = categoryRaw.trim() ? normalizeProductCategory(categoryRaw.trim()) : null;
  if (!categoryRaw.trim()) pushError("category_invalid", `Catégorie vide ou manquante.`, "category");

  const sizeRaw = fields.size ?? "";
  const skuTaille = catalogDisplaySizeToSkuTaille(sizeRaw);
  if (!skuTaille) pushError("size_invalid", `Taille non reconnue : « ${sizeRaw} ».`, "size");
  const size: ProductSize = !skuTaille
    ? sizeRaw
    : skuTaille === "XXL" && /^2\s*xl$/i.test(sizeRaw.trim())
      ? "2XL"
      : skuTailleToCatalogDisplaySize(skuTaille);

  const color = normalizeCatalogSheetColorDisplay(fields.color ?? "");
  if (!color) pushError("color_missing", undefined, "color");

  const modelName = cellString(fields.modelName);
  if (!modelName) pushError("model_name_missing", undefined, "modelName");

  if (issues.some((i) => i.level === "error")) {
    return { row: null, issues };
  }

  const parsedSku = parseSku(sku);
  if (parsedSku && skuTaille && parsedSku.taille !== skuTaille) {
    pushIssue(
      "error",
      "size_sku_mismatch",
      `Colonne Taille « ${size} » incompatible avec le bloc taille du SKU (${parsedSku.taille}).`,
      { sku, modelName, field: "size" },
    );
    return { row: null, issues };
  }

  if (parsedSku && color) {
    const expectedColoris = colorLabelToSkuColorisCode(color);
    if (expectedColoris && expectedColoris !== parsedSku.coloris) {
      pushIssue(
        "warning",
        "color_sku_drift",
        `Coloris « ${color} » → code ${expectedColoris}, le SKU indique ${parsedSku.coloris}.`,
        { sku, modelName, field: "color" },
      );
    }
  }

  if (parsedSku && category) {
    const categoryType = categoryToSkuTypeCode(category);
    if (categoryType && categoryType !== parsedSku.type) {
      pushIssue(
        "warning",
        "category_sku_type_drift",
        `Catégorie « ${category} » (type ${categoryType}) vs type SKU ${parsedSku.type}.`,
        { sku, modelName, field: "category" },
      );
    }
  }

  const row: CatalogSheetRow = {
    brand: brand!,
    modelName,
    sku,
    modelRef,
    unitPriceEuro: unitPriceEuro!,
    category: category!,
    color,
    size,
    gender: cellString(fields.gender) || "Unisexe",
    shortDescription: cellString(fields.shortDescription),
    longDescription: cellString(fields.longDescription),
    composition: cellString(fields.composition),
    highlights: cellString(fields.highlights),
    sourceLine: options?.sourceLine,
  };

  return { row, issues };
}
