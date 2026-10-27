"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BackgroundGradientProps = {
  children?: ReactNode;
  className?: string;
  containerClassName?: string;
  animate?: boolean;
};

export function BackgroundGradient({
  children,
  className,
  containerClassName,
  animate = false,
}: BackgroundGradientProps) {
  const motionClass = animate ? "dingry-card-gradient-animate" : "dingry-card-gradient-on-hover";

  return (
    <div className={cn("group relative p-[3px]", containerClassName)}>
      <div
        className={cn(
          "dingry-card-gradient absolute inset-0 z-[1] rounded-[22px] opacity-50 blur-lg group-hover:opacity-90",
          motionClass,
        )}
      />
      <div
        className={cn(
          "dingry-card-gradient absolute inset-0 z-[1] rounded-[22px] opacity-80",
          motionClass,
        )}
      />
      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
}
