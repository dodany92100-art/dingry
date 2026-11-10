import { describe, expect, it } from "vitest";
import type { AdminLookbookSlide } from "@/lib/admin/types";
import { publicLookbookSlides } from "@/lib/admin/store";

describe("publicLookbookSlides", () => {
  it("masque lb-4 même si elle reste dans le snapshot", () => {
    const slide: AdminLookbookSlide = {
      id: "lb-4",
      title: "Escaliers",
      caption: "Editorial",
      imageUrl: "https://example.com/stairs.jpg",
      blobUrl: null,
      blobPathname: null,
      sortOrder: 3,
      createdAt: "2026-10-01T10:00:00.000Z",
    };
    const slides = publicLookbookSlides({
      version: 4,
      products: [],
      orders: [],
      lookbook: [slide],
      removedLookbookSlideIds: [],
    });
    expect(slides.some((item) => item.id === "lb-4")).toBe(false);
  });
});
