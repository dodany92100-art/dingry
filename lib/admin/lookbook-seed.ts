import { LOOKBOOK_ENTRIES } from "@/lib/shop-data";
import type { AdminLookbookSlide } from "@/lib/admin/types";

export function seededLookbookSlides(): AdminLookbookSlide[] {
  return LOOKBOOK_ENTRIES.map(([src, title, caption], index) => ({
    id: `lb-${index + 1}`,
    title,
    caption,
    imageUrl: src,
    blobUrl: null,
    blobPathname: null,
    sortOrder: index,
    createdAt: "2026-10-01T10:00:00.000Z",
  }));
}
