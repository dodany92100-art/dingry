"use client";

import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

type InfiniteMovingCardsProps = {
  children: ReactNode;
  className?: string;
  /** Durée d’un cycle complet (deux copies = -50 %). */
  durationSeconds?: number;
  ariaLabel?: string;
};

export function InfiniteMovingCards({
  children,
  className,
  durationSeconds = 42,
  ariaLabel,
}: InfiniteMovingCardsProps) {
  return (
    <div
      className={cn("dingry-infinite-cards relative w-full overflow-hidden", className)}
      aria-label={ariaLabel}
      style={{ ["--dingry-card-scroll-duration" as string]: `${durationSeconds}s` }}
    >
      <div className="dingry-marquee-track flex w-max items-stretch gap-4 py-3 md:gap-6 md:py-4">
        {children}
      </div>
    </div>
  );
}
