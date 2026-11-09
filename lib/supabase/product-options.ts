import { buildColorDeclinationBackendFields } from "@/lib/admin/dingry-color-palette";
import {
  buildDingryMarketingParentSku,
  DINGRY_BRAND,
} from "@/lib/catalog/dingry-variant-naming";
import {
  normalizeOptionKey,
  optionSkuSuffixFromLabel,
  type ProductOption,
} from "@/lib/catalog/product-options";
import { supabaseAdmin } from "@/lib/supabase/server";

type ProductOptionRow = {
  id: string;
  product_id: string;
  option_key: string;
  label: string;
  sku_suffix: string;
  brand: string;
  color: string;
  variant_sku: string;
  alt_text: string;
  price_delta: number;
  image_url: string;
  image_blob_pathname: string | null;
  sort_order: number;
  is_default: boolean;
};

function rowToOption(row: ProductOptionRow): ProductOption {
  return {
    id: String(row.id),
    productId: String(row.product_id),
    optionKey: String(row.option_key),
    label: String(row.label),
    skuSuffix: String(row.sku_suffix),
    brand: String(row.brand ?? DINGRY_BRAND),
    color: String(row.color ?? row.option_key ?? ""),
    variantSku: String(row.variant_sku ?? ""),
    altText: String(row.alt_text ?? ""),
    priceDelta: Number(row.price_delta) || 0,
    imageUrl: String(row.image_url ?? ""),
    imageBlobPathname: row.image_blob_pathname ?? null,
    sortOrder: Number(row.sort_order) || 0,
    isDefault: Boolean(row.is_default),
  };
}

export async function listProductOptionsForProductIds(
  productIds: readonly string[],
): Promise<Map<string, ProductOption[]>> {
  const map = new Map<string, ProductOption[]>();
  if (productIds.length === 0) return map;
  const { data, error } = await supabaseAdmin()
    .from("product_options")
    .select("*")
    .in("product_id", [...productIds])
    .order("sort_order", { ascending: true });
  if (error) {
    if (error.code === "PGRST205" || error.message.includes("schema cache")) return map;
    throw new Error(error.message);
  }
  for (const row of (data ?? []) as ProductOptionRow[]) {
    const list = map.get(row.product_id) ?? [];
    list.push(rowToOption(row));
    map.set(row.product_id, list);
  }
  return map;
}

function resolveParentSkuForVariants(parentSku: string, category: string, productName: string): string {
  const trimmed = parentSku.trim().toUpperCase();
  if (trimmed.startsWith("DINGRY-")) return trimmed;
  if (trimmed.startsWith("DGRY-")) {
    return buildDingryMarketingParentSku(category, productName);
  }
  return trimmed || buildDingryMarketingParentSku(category, productName);
}

/** Aligne `product_options` sur les colorDeclinations CRM (sans écraser image_url existantes). */
export async function syncProductOptionsFromDeclinations(input: {
  productId: string;
  productName: string;
  parentSku: string;
  category: string;
  variant: string;
  colorDeclinations: readonly string[];
}): Promise<void> {
  const colors = input.colorDeclinations.map((c) => c.trim()).filter(Boolean);
  if (colors.length === 0) {
    await supabaseAdmin().from("product_options").delete().eq("product_id", input.productId);
    return;
  }

  const marketingParentSku = resolveParentSkuForVariants(
    input.parentSku,
    input.category,
    input.productName,
  );

  const existing = await listProductOptionsForProductIds([input.productId]);
  const byKey = new Map((existing.get(input.productId) ?? []).map((o) => [o.optionKey, o]));
  const defaultKey = normalizeOptionKey(input.variant);

  const rows = colors.map((label, index) => {
    const optionKey = normalizeOptionKey(label);
    const prev = byKey.get(optionKey);
    const auto = buildColorDeclinationBackendFields({
      productId: input.productId,
      productName: input.productName,
      parentSku: marketingParentSku,
      colorLabel: label,
    });
    const variantSku = prev?.variantSku?.trim() || auto.variantSku;
    const isDefault =
      defaultKey.length > 0 ? optionKey === defaultKey : index === 0 && !colors.some((c) => normalizeOptionKey(c) === defaultKey);
    return {
      product_id: input.productId,
      option_key: optionKey,
      label: label.toUpperCase(),
      sku_suffix: prev?.skuSuffix ?? optionSkuSuffixFromLabel(label),
      brand: DINGRY_BRAND,
      color: optionKey,
      variant_sku: variantSku,
      alt_text: prev?.altText?.trim() || auto.altText,
      price_delta: prev?.priceDelta ?? 0,
      image_url: prev?.imageUrl ?? "",
      image_blob_pathname: prev?.imageBlobPathname?.trim() || auto.imageBlobPathname,
      sort_order: index,
      is_default: colors.length === 1 ? true : isDefault,
    };
  });

  if (rows.length > 0 && !rows.some((r) => r.is_default)) {
    rows[0]!.is_default = true;
  }

  const { error: delError } = await supabaseAdmin()
    .from("product_options")
    .delete()
    .eq("product_id", input.productId);
  if (delError && delError.code !== "PGRST205") throw new Error(delError.message);

  const { error } = await supabaseAdmin().from("product_options").insert(rows);
  if (error) {
    if (error.code === "PGRST205") return;
    throw new Error(error.message);
  }
}
