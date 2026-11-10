"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "motion/react";
import { FlyParticle } from "@/components/atoms/ui/fly-particle";

import { queryFlyTargetRect, type FlyTarget } from "@/lib/fly-animation-targets";

export type { FlyTarget } from "@/lib/fly-animation-targets";

export type FlyVariant = "heart" | "cart";

type FlyPoint = { x: number; y: number };

type ActiveFly = {
  id: string;
  from: FlyPoint;
  to: FlyPoint;
  target: FlyTarget;
  variant: FlyVariant;
};

export type FlyPulse = {
  target: FlyTarget;
  at: number;
};

function centerOfRect(rect: DOMRect): FlyPoint {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

type FlyAnimationContextValue = {
  pulse: FlyPulse | null;
  launchFromElement: (from: HTMLElement, target: FlyTarget, variant: FlyVariant) => void;
};

const FlyAnimationContext = createContext<FlyAnimationContextValue | null>(null);

export function FlyAnimationProvider({ children }: { children: ReactNode }) {
  const [particles, setParticles] = useState<ActiveFly[]>([]);
  const [pulse, setPulse] = useState<FlyPulse | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const removeParticle = useCallback((id: string) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const launchFromElement = useCallback((from: HTMLElement, target: FlyTarget, variant: FlyVariant) => {
    const targetRect = queryFlyTargetRect(target);
    if (!targetRect) return;

    const fromRect = from.getBoundingClientRect();
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    setParticles((prev) => [
      ...prev,
      {
        id,
        from: centerOfRect(fromRect),
        to: centerOfRect(targetRect),
        target,
        variant,
      },
    ]);
  }, []);

  const onParticleComplete = useCallback(
    (id: string, target: FlyTarget) => {
      removeParticle(id);
      setPulse({ target, at: Date.now() });
    },
    [removeParticle],
  );

  const value = useMemo(
    () => ({
      pulse,
      launchFromElement,
    }),
    [pulse, launchFromElement],
  );

  const layer =
    mounted && typeof document !== "undefined"
      ? createPortal(
          <div className="pointer-events-none fixed inset-0 z-[80]" aria-hidden>
            <AnimatePresence>
              {particles.map((particle) => (
                <FlyParticle
                  key={particle.id}
                  from={particle.from}
                  to={particle.to}
                  variant={particle.variant}
                  onComplete={() => onParticleComplete(particle.id, particle.target)}
                />
              ))}
            </AnimatePresence>
          </div>,
          document.body,
        )
      : null;

  return (
    <FlyAnimationContext.Provider value={value}>
      {children}
      {layer}
    </FlyAnimationContext.Provider>
  );
}

export function useFlyAnimation(): FlyAnimationContextValue {
  const ctx = useContext(FlyAnimationContext);
  if (!ctx) {
    throw new Error("useFlyAnimation doit être utilisé dans FlyAnimationProvider.");
  }
  return ctx;
}

export function useFlyAnimationOptional(): FlyAnimationContextValue | null {
  return useContext(FlyAnimationContext);
}
