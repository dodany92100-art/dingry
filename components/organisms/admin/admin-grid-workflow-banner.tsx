"use client";

import { AnimatePresence, motion } from "motion/react";

export type AdminGridWorkflowPhase = "ordering" | "publish";

type AdminGridWorkflowBannerProps = {
  phase: AdminGridWorkflowPhase;
  orderSaving: boolean;
  publishSaving: boolean;
  draftCount: number;
  onReset: () => void;
  onValidateGrid: () => void;
  onPublishSelection: () => void;
};

const panelSpring = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.85 };

/** Double validation : ordre de grille puis mise en ligne groupée. */
export function AdminGridWorkflowBanner({
  phase,
  orderSaving,
  publishSaving,
  draftCount,
  onReset,
  onValidateGrid,
  onPublishSelection,
}: AdminGridWorkflowBannerProps) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex justify-center px-4 pb-4 md:pb-6"
      role="region"
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={panelSpring}
          className="pointer-events-auto flex w-full max-w-2xl flex-col gap-3 border border-zinc-800 bg-zinc-900 px-4 py-3 shadow-[0_0_40px_rgba(0,102,255,0.14)] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
        >
          {phase === "ordering" ? (
            <>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">
                Finalisez le classement avant de valider la grille
              </p>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={orderSaving}
                  onClick={onReset}
                  className="h-9 flex-1 border border-zinc-600 px-4 text-[10px] uppercase tracking-[0.18em] text-white/60 transition hover:border-zinc-400 hover:text-white disabled:opacity-40 sm:flex-none"
                >
                  Réinitialiser
                </button>
                <button
                  type="button"
                  disabled={orderSaving}
                  onClick={onValidateGrid}
                  className="h-9 flex-1 border border-white bg-white px-4 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-900 transition hover:bg-white/90 disabled:opacity-50 sm:flex-none"
                >
                  {orderSaving ? "Validation…" : "Valider la grille"}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">
                Grille validée · {draftCount} brouillon{draftCount > 1 ? "s" : ""} prêt
                {draftCount > 1 ? "s" : ""} à publier
              </p>
              <button
                type="button"
                disabled={publishSaving || draftCount === 0}
                onClick={onPublishSelection}
                className="h-10 w-full border border-white bg-white px-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-900 shadow-[0_0_24px_rgba(255,255,255,0.2)] transition hover:bg-white/90 disabled:opacity-45 sm:w-auto"
              >
                {publishSaving ? "Publication…" : "Mettre en ligne le drop →"}
              </button>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
