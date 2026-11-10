import { NextResponse } from "next/server";
import { loadStoreReadOnly, publicLookbookSlides, StoreUnavailableError } from "@/lib/admin/store";
import { listSupabaseLookbookSlides } from "@/lib/supabase/lookbook-slides";
import { isSupabaseStoreEnabled } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const revalidate = 60;

function toPublicSlide(slide: { id: string; title: string; caption: string; imageUrl: string }) {
  return {
    id: slide.id,
    title: slide.title,
    caption: slide.caption,
    image: slide.imageUrl,
  };
}

export async function GET() {
  try {
    if (isSupabaseStoreEnabled()) {
      const slides = await listSupabaseLookbookSlides({ activeOnly: true });
      return NextResponse.json({
        slides: slides.map(toPublicSlide),
      });
    }
    const store = await loadStoreReadOnly();
    const slides = [...publicLookbookSlides(store)]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(toPublicSlide);
    return NextResponse.json({ slides });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      return NextResponse.json({ error: "Lookbook momentanément indisponible." }, { status: 503 });
    }
    return NextResponse.json({ error: "Lookbook momentanément indisponible." }, { status: 500 });
  }
}
