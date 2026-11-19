import { adminSwatchHex, adminSwatchStyle } from "@/lib/admin/dingry-color-palette";
import { cn } from "@/lib/utils";

/** Silhouette éclaboussure (viewBox 24×24) — nette à petite taille. */
const PAINT_SPLASH_PATH =
  "M12 2.2c2.1.2 3.8 1.6 5.1 3.1 1.3 1.4 3.4 2 4.6 3.7 1.3 1.9.5 4.7-1.5 6.1-1.5 1.1-3.6 1.5-5.5 1.3-2.3-.3-4.6-1.5-5.8-3.5-1.5-2.4-1.2-5.6.8-7.6 1.2-1.2 2.6-2.2 4.2-2.4.3 0 .6-.05.9-.05zm4.2-1.1c.45 0 .8.35.8.8s-.35.8-.8.8-.8-.35-.8-.8.35-.8.8-.8zm-9.8 16.2c.38 0 .68.3.68.68s-.3.68-.68.68-.68-.3-.68-.68.3-.68.68-.68zm12.6-2.8c.32 0 .58.26.58.58s-.26.58-.58.58-.58-.26-.58-.58.26-.58.58-.58z";

const SIZE_PX = { xs: 12, sm: 16, md: 20 } as const;

function splashRotationDeg(raw: string): number {
  const key = raw.trim().toUpperCase();
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) | 0;
  }
  return (Math.abs(h) % 36) - 18;
}

function isLightSwatchFill(raw: string, fill: string): boolean {
  const key = raw.trim().toUpperCase();
  if (key === "BLANC" || key === "WHITE") return true;
  const lower = fill.toLowerCase();
  return lower === "#f4f4f5" || lower === "#fafaf9" || lower === "#ffffff";
}

export type DingryPaintSwatchProps = {
  colorKey: string;
  size?: keyof typeof SIZE_PX;
  /** Tuile grille CRM (ring blanc selon sélection). */
  active?: boolean;
  /** Puces « Sélectionnées » sur fond clair/sombre. */
  variant?: "tile" | "chip" | "preview";
  className?: string;
};

export function DingryPaintSwatch({
  colorKey,
  size = "md",
  active = false,
  variant = "tile",
  className,
}: DingryPaintSwatchProps) {
  const px = SIZE_PX[size];
  const fill = adminSwatchHex(colorKey) ?? adminSwatchStyle(colorKey).backgroundColor;
  const light = isLightSwatchFill(colorKey, fill);
  const rot = splashRotationDeg(colorKey);

  const wrapperClass = cn(
    "relative inline-flex shrink-0 items-center justify-center",
    variant === "tile" && "drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]",
    variant === "chip" && "ring-1 ring-black/10",
    variant === "preview" &&
      cn(
        "ring-2 ring-offset-1 ring-offset-[#0a0a0a]",
        active ? "ring-white/90" : "ring-transparent",
      ),
    className,
  );

  return (
    <span className={wrapperClass} style={{ width: px, height: px }} aria-hidden>
      <svg
        viewBox="0 0 24 24"
        width={px}
        height={px}
        className="block overflow-visible"
        role="presentation"
      >
        <path
          d={PAINT_SPLASH_PATH}
          fill={fill}
          stroke={light ? "rgba(120,113,108,0.5)" : "rgba(0,0,0,0.18)"}
          strokeWidth={light ? 0.65 : 0.35}
          strokeLinejoin="round"
          transform={`rotate(${rot} 12 12)`}
        />
      </svg>
    </span>
  );
}