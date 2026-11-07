import type { AdminProduct } from "@/lib/admin/types";
import { supabaseAdmin } from "@/lib/supabase/server";
import { adminProductToRow, rowToAdminProduct, type ProductRow } from "@/lib/supabase/product-row";

export async function listSupabaseProducts(): Promise<AdminProduct[]> {
  const { data, error } = await supabaseAdmin()
    .from("products")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as ProductRow[]).map(rowToAdminProduct);
}

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
  return rowToAdminProduct(data as ProductRow);
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
  if (error && error.code !== "PGRST205") throw new Error(error.message);
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
