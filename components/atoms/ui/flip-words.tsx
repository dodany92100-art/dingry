"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type FlipWordsProps = {
  words: readonly string[];
  durationMs?: number;
  className?: string;
  /** Boucle infinie (défaut). `false` = une seule lecture en cadence. */
  loop?: boolean;
  /** Après le dernier mot, revient au premier puis s’arrête (`loop: false`). */
  landOnFirst?: boolean;
};

export function FlipWords({
  words,
  durationMs = 3200,
  className,
  loop = true,
  landOnFirst = false,
}: FlipWordsProps) {
  const reduceMotion = useReducedMotion();
  const safeWords = useMemo(() => (words.length > 0 ? [...words] : [""]), [words]);
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [finished, setFinished] = useState(false);
  const pendingStopRef = useRef(false);
  const currentWord = safeWords[index] ?? safeWords[0];
  const minWidthCh = useMemo(
    () => safeWords.reduce((max, w) => Math.max(max, w.length), 0) + 0.5,
    [safeWords],
  );

  const advance = useCallback(() => {
    setIndex((i) => {
      if (loop) return (i + 1) % safeWords.length;

      if (landOnFirst) {
        if (i < safeWords.length - 1) return i + 1;
        if (i === safeWords.length - 1) {
          pendingStopRef.current = true;
          return 0;
        }
      }

      if (i < safeWords.length - 1) return i + 1;
      setFinished(true);
      return i;
    });
    setIsAnimating(true);
  }, [landOnFirst, loop, safeWords.length]);

  useEffect(() => {
    if (reduceMotion || safeWords.length < 2 || isAnimating || finished) return;
    const t = window.setTimeout(advance, durationMs);
    return () => window.clearTimeout(t);
  }, [advance, durationMs, finished, isAnimating, reduceMotion, safeWords.length]);

  if (reduceMotion || safeWords.length < 2) {
    return (
      <span className={cn("inline-block text-left", className)} style={{ minWidth: `${minWidthCh}ch` }}>
        {safeWords[0]}
      </span>
    );
  }

  if (finished) {
    return (
      <span className={cn("inline-block text-left", className)} style={{ minWidth: `${minWidthCh}ch` }}>
        {currentWord}
      </span>
    );
  }

  return (
    <span
      className={cn("dingry-flip-words relative inline-block overflow-hidden text-left align-baseline", className)}
      style={{ minWidth: `${minWidthCh}ch` }}
      aria-live="polite"
    >
      <AnimatePresence
        mode="wait"
        onExitComplete={() => {
          setIsAnimating(false);
          if (pendingStopRef.current) {
            pendingStopRef.current = false;
            setFinished(true);
          }
        }}
      >
        <motion.span
          key={currentWord + index}
          initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -16, filter: "blur(6px)", position: "absolute", left: 0, top: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 14, mass: 0.65 }}
          className="inline-block whitespace-nowrap"
        >
          {currentWord}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
