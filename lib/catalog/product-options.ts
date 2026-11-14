/** Options catalogue (parent + déclinaisons) — aligné table `product_options`. */

import { colorAbbrevFromDeclinationLabel } from "@/lib/catalog/dingry-color-abbrev";
import {
  abbrevSourceFromColorDeclination,
  displayLabelFromColorDeclination,
} from "@/lib/catalog/dingry-color-custom";
import {
  buildDingryVariantSku,
  buildVariantAltText,
  DINGRY_BRAND,
} from "@/lib/catalog/dingry-variant-naming";

export type ProductOption = {
  id: string;
  productId: string;
  optionKey: string;
  label: string;
  skuSuffix: string;
  brand: string;
  color: string;
  variantSku: string;
  altText: string;
  priceDelta: number;
  imageUrl: string;
  imageBlobPathname: string | null;
  sortOrder: number;
  isDefault: boolean;
};

/** Vue boutique (sans id interne obligatoire). */
export type ShopProductOption = {
  optionKey: string;
  label: string;
  skuSuffix: string;
  brand: string;
  color: string;
  variantSku: string;
  altText: string;
  priceDelta: number;
  imageUrl: string;
  isDefault: boolean;
};

const SKU_SUFFIX_MAX = 24;

export function normalizeOptionKey(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/[^A-Z0-9\s\-_]/g, "")
    .slice(0, SKU_SUFFIX_MAX);
}

export function optionSkuSuffixFromLabel(label: string): string {
  const key = normalizeOptionKey(label).replace(/\s+/g, "-");
  return key || "STD";
}

/** SKU ligne : `DGRY-TS-01-ROUGE` (parent + suffix). */
export function buildVariantSku(parentSku: string, option: Pick<ShopProductOption, "skuSuffix" | "optionKey">): string {
  const base = parentSku.trim().toUpperCase();
  if (!base) return option.skuSuffix || option.optionKey;
  const suffix = (option.skuSuffix || option.optionKey).trim().toUpperCase();
  if (!suffix) return base;
  if (base.endsWith(`-${suffix}`)) return base;
  return `${base}-${suffix}`;
}

function dingryOptionMeta(parentSku: string, productName: string, label: string) {
  const display = displayLabelFromColorDeclination(label);
  const color = normalizeOptionKey(abbrevSourceFromColorDeclination(label));
  const abbrev = colorAbbrevFromDeclinationLabel(label);
  return {
    brand: DINGRY_BRAND,
    color,
    variantSku: buildDingryVariantSku(parentSku, abbrev),
    altText: buildVariantAltText(productName, display),
  };
}

export function shopOptionsFromColorDeclinations(
  colors: readonly string[],
  defaultVariant: string,
  context?: { parentSku?: string; productName?: string },
): ShopProductOption[] {
  const parentSku = context?.parentSku?.trim() ?? "";
  const productName = context?.productName?.trim() ?? "";
  const defaultKey = normalizeOptionKey(defaultVariant);
  const seen = new Set<string>();
  const options: ShopProductOption[] = [];
  for (const raw of colors) {
    const label = raw.trim();
    if (!label) continue;
    const optionKey = normalizeOptionKey(abbrevSourceFromColorDeclination(label));
    if (!optionKey || seen.has(optionKey)) continue;
    seen.add(optionKey);
    const display = displayLabelFromColorDeclination(label);
    options.push({
      optionKey,
      label: display.toUpperCase(),
      skuSuffix: colorAbbrevFromDeclinationLabel(label),
      ...dingryOptionMeta(parentSku, productName, label),
      priceDelta: 0,
      imageUrl: "",
      isDefault: defaultKey.length > 0 ? optionKey === defaultKey : options.length === 0,
    });
  }
  if (options.length > 0 && !options.some((o) => o.isDefault)) {
    options[0]!.isDefault = true;
  }
  return options;
}

export function mergeDbOptionsWithDeclinations(
  dbOptions: ProductOption[],
  colorDeclinations: readonly string[],
  defaultVariant: string,
  context?: { parentSku?: string; productName?: string },
): ProductOption[] {
  if (dbOptions.length > 0) return [...dbOptions].sort((a, b) => a.sortOrder - b.sortOrder);
  const shop = shopOptionsFromColorDeclinations(colorDeclinations, defaultVariant, context);
  return shop.map((item, index) => ({
    id: `virtual-${item.optionKey}`,
    productId: "",
    optionKey: item.optionKey,
    label: item.label,
    skuSuffix: item.skuSuffix,
    brand: item.brand,
    color: item.color,
    variantSku: item.variantSku,
    altText: item.altText,
    priceDelta: item.priceDelta,
    imageUrl: item.imageUrl,
    imageBlobPathname: null,
    sortOrder: index,
    isDefault: item.isDefault,
  }));
}

export function shopOptionsFromProductOptions(options: ProductOption[]): ShopProductOption[] {
  return options.map((o) => ({
    optionKey: o.optionKey,
    label: o.label,
    skuSuffix: o.skuSuffix,
    brand: o.brand,
    color: o.color,
    variantSku: o.variantSku,
    altText: o.altText,
    priceDelta: o.priceDelta,
    imageUrl: o.imageUrl,
    isDefault: o.isDefault,
  }));
}

export function resolveOptionVisual(
  parentImage: string,
  options: readonly ShopProductOption[],
  selectedOptionKey: string | null | undefined,
): { image: string; option: ShopProductOption | null } {
  const key = selectedOptionKey?.trim() ? normalizeOptionKey(selectedOptionKey) : "";
  const match =
    (key ? options.find((o) => o.optionKey === key) : undefined) ??
    options.find((o) => o.isDefault) ??
    options[0] ??
    null;
  const image = match?.imageUrl?.trim() ? match.imageUrl : parentImage;
  return { image, option: match };
}

/** SKU checkout : préfère `variantSku` DINGRY si présent. */
export function resolveLineVariantSku(parentSku: string, option: ShopProductOption | null | undefined): string {
  if (option?.variantSku?.trim()) return option.variantSku.trim().toUpperCase();
  if (!option) return parentSku.trim().toUpperCase();
  return buildVariantSku(parentSku, option);
}
