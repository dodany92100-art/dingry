"use client";

import { useEffect } from "react";
import { Heart } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

const FLY_ARC_PX = 110;
const FLY_DURATION_S = 0.6;

type FlyPoint = { x: number; y: number };

type FlyParticleProps = {
  from: FlyPoint;
  to: FlyPoint;
  variant: "heart" | "cart";
  onComplete: () => void;
};

export function FlyParticle({ from, to, variant, onComplete }: FlyParticleProps) {
  const reduceMotion = useReducedMotion();
  const mid: FlyPoint = {
    x: (from.x + to.x) / 2,
    y: Math.min(from.y, to.y) - FLY_ARC_PX,
  };

  useEffect(() => {
    if (reduceMotion) onComplete();
  }, [reduceMotion, onComplete]);

  if (reduceMotion) return null;

  return (
    <motion.div
      className="dingry-fly-particle absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 will-change-[transform,opacity]"
      initial={{ x: from.x, y: from.y, scale: 1, opacity: 1 }}
      animate={{
        x: [from.x, mid.x, to.x],
        y: [from.y, mid.y, to.y],
        scale: [1, 0.65, 0.3],
        opacity: [1, 0.92, 0.12],
      }}
      transition={{
        duration: FLY_DURATION_S,
        times: [0, 0.42, 1],
        ease: ["easeOut", "easeInOut", "easeIn"],
      }}
      onAnimationComplete={onComplete}
    >
      {variant === "heart" ? (
        <Heart size={22} strokeWidth={1.5} className="dingry-nav-favoris-heart--on" />
      ) : (
        <span className="dingry-nav-favoris-badge block h-3.5 min-w-3.5 rounded-sm" aria-hidden />
      )}
    </motion.div>
  );
}
