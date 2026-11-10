import { NextResponse } from "next/server";
import { loadStoreReadOnly, publicLookbookSlides, StoreUnavailableError } from "@/lib/admin/store";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  try {
    const store = await loadStoreReadOnly();
    const slides = [...publicLookbookSlides(store)]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((slide) => ({
        id: slide.id,
        title: slide.title,
        caption: slide.caption,
        image: slide.imageUrl,
      }));
    return NextResponse.json({ slides });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      return NextResponse.json({ error: "Lookbook momentanément indisponible." }, { status: 503 });
    }
    return NextResponse.json({ error: "Lookbook momentanément indisponible." }, { status: 500 });
  }
}
