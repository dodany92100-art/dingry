"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";

export type AdminActionToastState = {
  message: string;
  variant: "success" | "error";
} | null;

type AdminActionToastProps = {
  toast: AdminActionToastState;
  onDismiss: () => void;
};

export function AdminActionToast({ toast, onDismiss }: AdminActionToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onDismiss, 4200);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  const border =
    toast?.variant === "success" ? "border-emerald-500/50" : "border-red-500/50";
  const accent = toast?.variant === "success" ? "text-emerald-400" : "text-red-400";

  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.22 }}
          className={`pointer-events-none fixed bottom-24 left-1/2 z-[130] w-[min(92vw,26rem)] -translate-x-1/2 border ${border} bg-[#0a0a0a]/96 px-5 py-4 shadow-lg backdrop-blur-md`}
        >
          <p className={`text-[10px] font-medium tracking-[0.22em] uppercase ${accent}`}>
            {toast.variant === "success" ? "Enregistré" : "Échec"}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/90">{toast.message}</p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
