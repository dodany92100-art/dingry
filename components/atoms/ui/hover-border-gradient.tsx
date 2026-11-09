"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type ElementType,
  type HTMLAttributes,
  type MouseEvent,
  type PropsWithChildren,
} from "react";
import { cn } from "@/lib/utils";

type Direction = "TOP" | "LEFT" | "BOTTOM" | "RIGHT";

type HoverBorderGradientProps = HTMLAttributes<HTMLElement> &
  Partial<ButtonHTMLAttributes<HTMLButtonElement>> & {
    as?: ElementType;
    containerClassName?: string;
    className?: string;
    duration?: number;
    clockwise?: boolean;
  };

const DIRECTIONS: Direction[] = ["TOP", "LEFT", "BOTTOM", "RIGHT"];

const movingMap: Record<Direction, string> = {
  TOP: "radial-gradient(20.7% 50% at 50% 0%, rgba(0, 102, 255, 0.85) 0%, rgba(0, 102, 255, 0) 100%)",
  LEFT: "radial-gradient(16.6% 43.1% at 0% 50%, rgba(0, 102, 255, 0.85) 0%, rgba(0, 102, 255, 0) 100%)",
  BOTTOM: "radial-gradient(20.7% 50% at 50% 100%, rgba(0, 102, 255, 0.85) 0%, rgba(0, 102, 255, 0) 100%)",
  RIGHT:
    "radial-gradient(16.2% 41.2% at 100% 50%, rgba(0, 102, 255, 0.85) 0%, rgba(0, 102, 255, 0) 100%)",
};

const highlight =
  "radial-gradient(75% 160% at 50% 50%, rgba(0, 102, 255, 0.95) 0%, rgba(255, 255, 255, 0) 100%)";

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Tag = "button",
  duration = 1.15,
  clockwise = true,
  onMouseEnter,
  onMouseLeave,
  ...props
}: PropsWithChildren<HoverBorderGradientProps>) {
  const [hovered, setHovered] = useState(false);
  const [direction, setDirection] = useState<Direction>("TOP");

  const rotateDirection = useCallback(
    (currentDirection: Direction): Direction => {
      const currentIndex = DIRECTIONS.indexOf(currentDirection);
      const nextIndex = clockwise
        ? (currentIndex - 1 + DIRECTIONS.length) % DIRECTIONS.length
        : (currentIndex + 1) % DIRECTIONS.length;
      return DIRECTIONS[nextIndex] ?? currentDirection;
    },
    [clockwise],
  );

  useEffect(() => {
    if (hovered) return;
    const interval = window.setInterval(() => {
      setDirection((prev) => rotateDirection(prev));
    }, duration * 1000);
    return () => window.clearInterval(interval);
  }, [duration, hovered, rotateDirection]);

  return (
    <Tag
      onMouseEnter={(event: MouseEvent<HTMLElement>) => {
        setHovered(true);
        onMouseEnter?.(event as never);
      }}
      onMouseLeave={(event: MouseEvent<HTMLElement>) => {
        setHovered(false);
        onMouseLeave?.(event as never);
      }}
      className={cn(
        "relative flex h-min w-fit flex-col flex-nowrap items-center justify-center gap-10 overflow-visible border border-transparent bg-black/10 p-px decoration-clone transition duration-500",
        containerClassName,
      )}
      {...props}
    >
      <div className={cn("relative z-[2] w-auto text-white", className)}>{children}</div>
      <div
        className="absolute inset-0 z-0 flex-none overflow-hidden rounded-[inherit]"
        style={{
          filter: "blur(2px)",
          width: "100%",
          height: "100%",
          background: hovered ? highlight : movingMap[direction],
          transition: `background ${duration}s linear`,
        }}
      />
      <div className="absolute inset-[1px] z-[1] flex-none rounded-[inherit] bg-[#12151c]" />
    </Tag>
  );
}
