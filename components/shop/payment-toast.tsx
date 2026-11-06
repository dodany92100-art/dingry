"use client";

import { AnimatePresence, motion } from "motion/react";
import { MODAL_OVERLAY_TRANSITION } from "./motion";

export function PaymentToast({ visible }: { visible: boolean }) {
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
          className="pointer-events-none fixed top-24 left-1/2 z-[80] w-[min(92vw,24rem)] -translate-x-1/2 border border-[#0066FF]/45 bg-[#0a0a0a]/95 px-5 py-4 shadow-[0_12px_40px_rgba(0,102,255,0.15)] backdrop-blur-md"
        >
          <p className="text-[10px] font-medium tracking-[0.32em] text-[#0066FF] uppercase">Commande validée</p>
          <p className="mt-2 text-sm leading-relaxed text-white/90">Un reçu e-mail vous a été envoyé par PayPal.</p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
