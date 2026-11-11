"use client";

import { AnimatePresence, motion } from "motion/react";
import { MODAL_OVERLAY_TRANSITION } from "@/components/organisms/shop/motion";

type DingryCopyToastProps = {
  visible: boolean;
  message?: string;
};

export function DingryCopyToast({ visible, message = "Lien copié !" }: DingryCopyToastProps) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ ...MODAL_OVERLAY_TRANSITION, duration: 0.28 }}
          className="pointer-events-none fixed top-24 left-1/2 z-[85] w-[min(92vw,24rem)] -translate-x-1/2 border border-white/20 bg-[#0a0a0a]/95 px-5 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
        >
          <p className="text-sm leading-relaxed text-white/90">{message}</p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
