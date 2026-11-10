import { LOOKBOOK_ENTRIES } from "@/lib/shop-data";
import type { AdminLookbookSlide } from "@/lib/admin/types";

/** Slides seed retirées du lookbook (produit / caps inchangés en boutique). */
export const RETIRED_LOOKBOOK_SEED_TITLES = new Set(["DYRON — AFRO PUNK"]);

/** Slides retirées côté code (ex. lb-4 escaliers — retirée en prod, évite la réapparition). */
export const DEFAULT_REMOVED_LOOKBOOK_SLIDE_IDS = ["lb-4"] as const;

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
