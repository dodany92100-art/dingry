import { describe, expect, it } from "vitest";
import {
  collageSlotForIndex,
  isLookbookVideoUrl,
  lookbookStageMinHeightCss,
  partitionLookbookMontage,
  LOOKBOOK_MONTAGE_SLOTS,
} from "@/lib/lookbook-moodboard";

describe("lookbook-moodboard", () => {
  it("détecte les URLs vidéo lookbook", () => {
    expect(isLookbookVideoUrl("https://cdn.test/clip.mp4")).toBe(true);
    expect(isLookbookVideoUrl("https://cdn.test/frame.jpg")).toBe(false);
  });

  it("partition : vidéo (ou 1ʳᵉ slide) dans le cadre 9:16, reste au moodboard", () => {
    const slides = [
      { image: "a.jpg" },
      { image: "b.mp4" },
      { image: "c.jpg" },
    ];
    const { phoneSlide, collageSlides } = partitionLookbookMontage(slides);
    expect(phoneSlide?.image).toBe("b.mp4");
    expect(collageSlides).toHaveLength(2);
    expect(collageSlides.map((s) => s.image)).toEqual(["a.jpg", "c.jpg"]);
  });

  it("hauteur scène bornée (pas de min-height catalogue)", () => {
    const many = lookbookStageMinHeightCss(14, false);
    expect(many).toMatch(/clamp\(\d+rem,/);
    const match = many.match(/clamp\((\d+)rem/);
    expect(Number(match?.[1])).toBeLessThanOrEqual(40);

    const few = lookbookStageMinHeightCss(2, false);
    const fewMatch = few.match(/clamp\((\d+)rem/);
    expect(Number(fewMatch?.[1])).toBeLessThanOrEqual(36);
  });

  it("16 emplacements montage distincts", () => {
    expect(LOOKBOOK_MONTAGE_SLOTS).toHaveLength(16);
    const a = collageSlotForIndex(0, 12);
    const b = collageSlotForIndex(1, 12);
    expect(`${a.top}|${a.left}`).not.toBe(`${b.top}|${b.left}`);
  });
});