import { mergeDbOptionsWithDeclinations } from "@/lib/catalog/product-options";
import type { AdminProduct } from "@/lib/admin/types";
import { supabaseAdmin } from "@/lib/supabase/server";
import { adminProductToRow, rowToAdminProduct, type ProductRow } from "@/lib/supabase/product-row";
import { listProductOptionsForProductIds, syncProductOptionsFromDeclinations } from "@/lib/supabase/product-options";

export async function listSupabaseProducts(): Promise<AdminProduct[]> {
  const { data, error } = await supabaseAdmin()
    .from("products")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw new Error(error.message);
  const products = ((data ?? []) as ProductRow[]).map(rowToAdminProduct);
  const optionMap = await listProductOptionsForProductIds(products.map((p) => p.id));
  return products.map((product) => ({
    ...product,
    options: mergeDbOptionsWithDeclinations(
      optionMap.get(product.id) ?? [],
      product.colorDeclinations,
      product.variant,
      { parentSku: product.sku, productName: product.name },
    ),
  }));
}

export { syncProductOptionsFromDeclinations };

export async function getSupabaseProduct(id: string): Promise<AdminProduct | null> {
  const { data, error } = await supabaseAdmin().from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToAdminProduct(data as ProductRow) : null;
}

export async function upsertSupabaseProduct(product: AdminProduct): Promise<AdminProduct> {
  const { data, error } = await supabaseAdmin()
    .from("products")
    .upsert(adminProductToRow(product), { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const saved = rowToAdminProduct(data as ProductRow);
  await syncProductOptionsFromDeclinations({
    productId: saved.id,
    productName: saved.name,
    parentSku: saved.sku,
    category: saved.category,
    variant: saved.variant,
    colorDeclinations: saved.colorDeclinations,
  });
  const options = await listProductOptionsForProductIds([saved.id]);
  return {
    ...saved,
    options: mergeDbOptionsWithDeclinations(
      options.get(saved.id) ?? [],
      saved.colorDeclinations,
      saved.variant,
      { parentSku: saved.sku, productName: saved.name },
    ),
  };
}

export async function deleteSupabaseProduct(id: string): Promise<boolean> {
  const { error, count } = await supabaseAdmin().from("products").delete({ count: "exact" }).eq("id", id);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function nextSupabaseProductId(existing: AdminProduct[]): Promise<string> {
  const max = existing.reduce((current, item) => {
    const value = Number(item.id);
    return Number.isInteger(value) && value > current ? value : current;
  }, 0);
  return String(max + 1);
}

export async function listRemovedCatalogIds(): Promise<string[]> {
  const { data, error } = await supabaseAdmin().from("catalog_removed_ids").select("id");
  if (error) {
    if (error.code === "PGRST205" || error.message.includes("schema cache")) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => String((row as { id: string }).id));
}

export async function addRemovedCatalogIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabaseAdmin()
    .from("catalog_removed_ids")
    .upsert(ids.map((id) => ({ id })), { onConflict: "id" });
  if (error) {
    if (error.code === "PGRST205" || error.message.includes("schema cache")) {
      console.warn("[supabase] catalog_removed_ids absent — tombstone conservé côté snapshot.");
      return;
    }
    throw new Error(error.message);
  }
}

export async function reorderSupabaseProducts(orderedIds: string[]): Promise<AdminProduct[]> {
  for (let index = 0; index < orderedIds.length; index += 1) {
    const { error } = await supabaseAdmin()
      .from("products")
      .update({ display_order: index })
      .eq("id", orderedIds[index]);
    if (error) throw new Error(error.message);
  }
  return listSupabaseProducts();
}
