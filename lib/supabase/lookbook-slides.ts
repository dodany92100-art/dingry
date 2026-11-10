import type { AdminLookbookSlide } from "@/lib/admin/types";
import { supabaseAdmin } from "@/lib/supabase/server";

export type LookbookSlideRow = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  image_blob_pathname: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function rowToAdminLookbookSlide(row: LookbookSlideRow): AdminLookbookSlide {
  return {
    id: row.id,
    title: row.title,
    caption: row.subtitle,
    imageUrl: row.image_url,
    blobUrl: row.image_url,
    blobPathname: row.image_blob_pathname,
    sortOrder: row.display_order,
    createdAt: row.created_at,
  };
}

function adminSlideToRow(
  slide: AdminLookbookSlide,
  extra?: { linkUrl?: string; isActive?: boolean },
): Omit<LookbookSlideRow, "created_at" | "updated_at"> & { updated_at: string } {
  const now = new Date().toISOString();
  return {
    id: slide.id,
    title: slide.title,
    subtitle: slide.caption,
    image_url: slide.imageUrl,
    link_url: extra?.linkUrl ?? "",
    image_blob_pathname: slide.blobPathname,
    display_order: slide.sortOrder,
    is_active: extra?.isActive ?? true,
    updated_at: now,
  };
}

export async function listSupabaseLookbookSlides(options?: {
  activeOnly?: boolean;
}): Promise<AdminLookbookSlide[]> {
  let query = supabaseAdmin().from("lookbook_slides").select("*").order("display_order", { ascending: true });
  if (options?.activeOnly) {
    query = query.eq("is_active", true);
  }
  const { data, error } = await query;
  if (error) {
    if (error.code === "PGRST205" || error.message.includes("schema cache")) return [];
    throw new Error(error.message);
  }
  return ((data ?? []) as LookbookSlideRow[]).map(rowToAdminLookbookSlide);
}

export async function insertSupabaseLookbookSlide(
  slide: AdminLookbookSlide,
  options?: { linkUrl?: string },
): Promise<AdminLookbookSlide> {
  const row = { ...adminSlideToRow(slide, options), created_at: slide.createdAt || new Date().toISOString() };
  const { data, error } = await supabaseAdmin().from("lookbook_slides").insert(row).select("*").single();
  if (error) throw new Error(error.message);
  return rowToAdminLookbookSlide(data as LookbookSlideRow);
}

export async function updateSupabaseLookbookSlide(
  slide: AdminLookbookSlide,
  options?: { linkUrl?: string; isActive?: boolean },
): Promise<AdminLookbookSlide> {
  const row = adminSlideToRow(slide, options);
  const { data, error } = await supabaseAdmin()
    .from("lookbook_slides")
    .update({
      title: row.title,
      subtitle: row.subtitle,
      image_url: row.image_url,
      link_url: row.link_url,
      image_blob_pathname: row.image_blob_pathname,
      display_order: row.display_order,
      is_active: row.is_active,
      updated_at: row.updated_at,
    })
    .eq("id", slide.id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return rowToAdminLookbookSlide(data as LookbookSlideRow);
}

export async function deleteSupabaseLookbookSlide(id: string): Promise<boolean> {
  const { error, count } = await supabaseAdmin()
    .from("lookbook_slides")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function reorderSupabaseLookbookSlides(orderedIds: string[]): Promise<AdminLookbookSlide[]> {
  for (let index = 0; index < orderedIds.length; index += 1) {
    const id = orderedIds[index];
    if (!id) continue;
    const { error } = await supabaseAdmin()
      .from("lookbook_slides")
      .update({ display_order: index, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
  return listSupabaseLookbookSlides();
}
