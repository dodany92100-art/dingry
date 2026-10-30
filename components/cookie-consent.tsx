"use client";

import { Analytics } from "@vercel/analytics/next";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  DINGRY_COOKIE_CONSENT_KEY,
  type DingryCookieConsent,
  readCookieConsent,
} from "@/lib/cookie-consent";

const OVERLAY_EASE = [0.16, 1, 0.3, 1] as const;

export function CookieConsent() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isTeaser = pathname === "/";
  const [visible, setVisible] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    if (isAdmin) return;
    const stored = readCookieConsent();
    if (stored === "accepted") {
      setAnalyticsEnabled(true);
    }
    if (!stored) {
      setVisible(true);
    }
  }, [isAdmin]);

  const choose = useCallback((value: DingryCookieConsent) => {
    localStorage.setItem(DINGRY_COOKIE_CONSENT_KEY, value);
    setVisible(false);
    if (value === "accepted") {
      setAnalyticsEnabled(true);
    }
  }, []);

  if (isAdmin || isTeaser) {
    return null;
  }

  return (
    <>
      {process.env.NODE_ENV === "production" && analyticsEnabled ? <Analytics /> : null}
      <AnimatePresence>
        {visible ? (
          <motion.div
            role="dialog"
            aria-labelledby="dingry-cookie-title"
            aria-describedby="dingry-cookie-desc"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.35, ease: OVERLAY_EASE }}
            className="fixed inset-x-0 bottom-0 z-[100] border-t border-white/10 bg-[#0a0a0a]/92 px-4 py-4 backdrop-blur-xl md:px-8 md:py-5"
          >
            <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-8">
              <div className="min-w-0">
                <p
                  id="dingry-cookie-title"
                  className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#0066FF]"
                >
                  Cookies DINGRY
                </p>
                <p id="dingry-cookie-desc" className="mt-2 text-xs leading-relaxed text-white/60 md:text-sm">
                  Nous utilisons des cookies essentiels au fonctionnement du site et, si vous acceptez, des cookies de
                  mesure d&apos;audience (Vercel Analytics) pour améliorer l&apos;expérience. Refuser n&apos;empêche pas
                  la navigation ni les commandes.
                </p>
                <Link
                  href="/#mentions-legales"
                  className="mt-2 inline-block text-[10px] uppercase tracking-[0.2em] text-white/45 underline-offset-4 transition-colors hover:text-[#7EB3FF] hover:underline"
                  onClick={() => setVisible(false)}
                >
                  Politique de confidentialité
                </Link>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => choose("rejected")}
                  className="h-10 border border-white/15 px-5 text-[10px] font-medium uppercase tracking-[0.2em] text-white/65 transition-colors hover:border-white/35 hover:text-white"
                >
                  Refuser
                </button>
                <button
                  type="button"
                  onClick={() => choose("accepted")}
                  className="h-10 bg-[#0066FF] px-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#0052cc]"
                >
                  Accepter
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
