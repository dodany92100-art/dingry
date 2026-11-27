export function isLookbookVideoUrl(url: string): boolean {
  return /\.(mp4|webm)(\?|#|$)/i.test(url.trim());
}

export type LookbookCollageAspect = "portrait" | "square" | "landscape";

export type LookbookFrameStyle = "archive" | "polaroid" | "bare";

export type LookbookCollageSlot = {
  top: string;
  left: string;
  width: string;
  aspect: LookbookCollageAspect;
  zIndex: number;
  frame: LookbookFrameStyle;
  /** Déplacement parallax (scroll) · px */
  parallax: number;
};

/** Emplacements collage · pleine largeur (sans cadre hero). */
export const LOOKBOOK_MONTAGE_SLOTS: readonly LookbookCollageSlot[] = [
  { top: "1%", left: "30%", width: "18%", aspect: "portrait", zIndex: 5, frame: "archive", parallax: 18 },
  { top: "8%", left: "48%", width: "20%", aspect: "portrait", zIndex: 7, frame: "bare", parallax: 24 },
  { top: "3%", left: "68%", width: "15%", aspect: "square", zIndex: 4, frame: "polaroid", parallax: 12 },
  { top: "14%", left: "54%", width: "16%", aspect: "landscape", zIndex: 7, frame: "bare", parallax: 26 },
  { top: "18%", left: "72%", width: "16%", aspect: "portrait", zIndex: 6, frame: "polaroid", parallax: 18 },
  { top: "24%", left: "6%", width: "15%", aspect: "square", zIndex: 4, frame: "archive", parallax: 16 },
  { top: "27%", left: "24%", width: "22%", aspect: "landscape", zIndex: 8, frame: "polaroid", parallax: 28 },
  { top: "26%", left: "46%", width: "15%", aspect: "portrait", zIndex: 5, frame: "bare", parallax: 14 },
  { top: "36%", left: "62%", width: "14%", aspect: "portrait", zIndex: 9, frame: "polaroid", parallax: 24 },
  { top: "39%", left: "78%", width: "17%", aspect: "portrait", zIndex: 6, frame: "archive", parallax: 20 },
  { top: "38%", left: "36%", width: "13%", aspect: "square", zIndex: 4, frame: "bare", parallax: 12 },
  { top: "48%", left: "52%", width: "22%", aspect: "landscape", zIndex: 7, frame: "archive", parallax: 30 },
  { top: "50%", left: "8%", width: "16%", aspect: "portrait", zIndex: 5, frame: "bare", parallax: 16 },
  { top: "51%", left: "26%", width: "15%", aspect: "portrait", zIndex: 6, frame: "bare", parallax: 18 },
  { top: "60%", left: "44%", width: "17%", aspect: "portrait", zIndex: 8, frame: "polaroid", parallax: 22 },
  { top: "59%", left: "68%", width: "14%", aspect: "square", zIndex: 5, frame: "archive", parallax: 14 },
] as const;

const COLLAGE_MAX_RIGHT_PCT = 96;

function clampCollageSlot(slot: LookbookCollageSlot): LookbookCollageSlot {
  const left = parseFloat(slot.left);
  const width = parseFloat(slot.width);
  const cappedWidth = Math.min(width, Math.max(10, COLLAGE_MAX_RIGHT_PCT - left));
  return { ...slot, width: `${cappedWidth}%` };
}

const FRAME_CYCLE: readonly LookbookFrameStyle[] = ["archive", "bare", "polaroid", "bare", "archive", "polaroid"];
const ASPECT_CYCLE: readonly LookbookCollageAspect[] = [
  "portrait",
  "square",
  "landscape",
  "portrait",
  "landscape",
  "square",
];

function overflowMontageSlot(index: number): LookbookCollageSlot {
  const band = index - LOOKBOOK_MONTAGE_SLOTS.length;
  const row = Math.floor(band / 2);
  return clampCollageSlot({
    top: `${Math.min(66, 6 + row * 8 + (band % 2) * 4)}%`,
    left: `${4 + (band % 6) * 13}%`,
    width: "12%",
    aspect: aspectForIndex(index),
    zIndex: 3 + (index % 6),
    frame: FRAME_CYCLE[index % FRAME_CYCLE.length] ?? "bare",
    parallax: 10 + (index % 4) * 3,
  });
}

function aspectForIndex(index: number): LookbookCollageAspect {
  return ASPECT_CYCLE[index % ASPECT_CYCLE.length] ?? "portrait";
}

export function collageSlotForIndex(index: number, _totalCollage?: number): LookbookCollageSlot {
  const preset = LOOKBOOK_MONTAGE_SLOTS[index];
  if (preset) {
    return clampCollageSlot({ ...preset, zIndex: preset.zIndex + (index % 2) });
  }
  return overflowMontageSlot(index);
}

function collageSlotExtentPercent(slot: LookbookCollageSlot): number {
  const top = parseFloat(slot.top);
  const width = parseFloat(slot.width);
  const heightFactor =
    slot.aspect === "portrait" ? 4 / 3 : slot.aspect === "landscape" ? 3 / 4 : 1;
  const framePad = slot.frame === "polaroid" ? width * 0.18 : 0;
  return top + width * heightFactor * 0.48 + framePad;
}

/** Hauteur scène calée sur l’étendue réelle du collage. */
export function lookbookStageMinHeightCss(collageCount: number, hasPhoneFrame = false): string {
  if (collageCount === 0 && !hasPhoneFrame) {
    return "clamp(22rem, 36vw, 28rem)";
  }

  let collageExtent = collageCount > 0 ? 0 : 28;
  for (let i = 0; i < collageCount; i++) {
    collageExtent = Math.max(collageExtent, collageSlotExtentPercent(collageSlotForIndex(i, collageCount)));
  }

  const phoneExtent = hasPhoneFrame ? 56 : 0;
  const span = Math.min(78, Math.max(collageExtent + 6, phoneExtent));

  const minRem = Math.round(26 + (span / 100) * 16);
  const maxRem = Math.min(46, minRem + 6);
  const vwMid = Math.round(38 + (span / 100) * 12);

  return `clamp(${minRem}rem, ${vwMid}vw, ${maxRem}rem)`;
}

export type LookbookMontagePartition<T extends { image: string }> = {
  phoneSlide: T | null;
  collageSlides: T[];
};

/** Cadre 9:16 = vidéo lifestyle si présente, sinon 1ʳᵉ slide · reste en moodboard asymétrique. */
export function partitionLookbookMontage<T extends { image: string }>(
  slides: readonly T[],
): LookbookMontagePartition<T> {
  if (slides.length === 0) {
    return { phoneSlide: null, collageSlides: [] };
  }
  const videoIndex = slides.findIndex((slide) => isLookbookVideoUrl(slide.image));
  if (videoIndex >= 0) {
    const phoneSlide = slides[videoIndex] ?? null;
    const collageSlides = slides.filter((_, index) => index !== videoIndex);
    return { phoneSlide, collageSlides };
  }
  return {
    phoneSlide: slides[0] ?? null,
    collageSlides: slides.slice(1),
  };
}