"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { LEGAL_DOCUMENTS, type LegalDocId } from "@/lib/legal-placeholders";

const MODAL_OVERLAY_EASE = [0.16, 1, 0.3, 1] as const;
const MODAL_PANEL_SPRING = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.85 };

function InstagramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function ShopFooter() {
  const [legalDoc, setLegalDoc] = useState<LegalDocId | null>(null);
  const activeLegal = legalDoc ? LEGAL_DOCUMENTS[legalDoc] : null;

  return (
    <>
      <footer className="border-t border-white/[0.05] px-6 md:px-12 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-2xl font-bold tracking-[0.3em] mb-3">DINGRY</p>
            <p className="text-xs text-white/35 tracking-widest leading-relaxed">
              Paris / Lyon
              <br />
              Streetwear en édition limitée
            </p>
            <a
              href="https://www.instagram.com/dingry_officiel/"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/55 transition-colors hover:text-[#0066FF]"
              aria-label="Instagram @dingry_officiel"
            >
              <InstagramIcon />
              @dingry_officiel
            </a>
          </div>

          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-white/40">Contact</p>
            <ul className="space-y-2 text-xs tracking-wide text-white/45">
              <li>
                <a href="mailto:contact@dingry.fr" className="hover:text-white transition-colors">
                  contact@dingry.fr
                </a>
              </li>
              <li>+33 1 42 00 00 00</li>
              <li>12 rue du Temple, 75004 Paris</li>
              <li className="text-[10px] text-white/25 pt-1">Coordonnées fictives — à remplacer</li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-white/40">Service</p>
            <ul className="space-y-2 text-xs tracking-widest text-white/35">
              <li>Livraison offerte en France</li>
              <li>Retours gratuits sous 30 jours</li>
              <li>Pièces numérotées — édition limitée</li>
            </ul>
          </div>

          <div id="mentions-legales">
            <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-white/40">Informations légales</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setLegalDoc("cgv")}
                className="w-fit border border-white/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/70 transition-colors hover:border-white/40 hover:text-white"
              >
                CGV
              </button>
              <button
                type="button"
                onClick={() => setLegalDoc("rgpd")}
                className="w-fit border border-white/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/70 transition-colors hover:border-white/40 hover:text-white"
              >
                RGPD
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/[0.05] pt-6">
          <p className="mb-4 text-center text-[10px] uppercase tracking-[0.28em] text-white/40">
            Moyens de paiement
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-2" aria-label="Moyens de paiement acceptés">
            {["CB", "Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay", "PayPal"].map((method) => (
              <li
                key={method}
                className="flex h-8 items-center justify-center border border-white/15 bg-white/[0.03] px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75"
              >
                {method}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-center text-[10px] tracking-widest text-white/20">
          © {new Date().getFullYear()} DINGRY. Tous droits réservés.
        </p>
      </footer>

      <AnimatePresence>
        {activeLegal && legalDoc ? (
          <div
            key={`legal-${legalDoc}`}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8"
          >
            <motion.div
              className="absolute inset-0 bg-[#050505]/90 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: MODAL_OVERLAY_EASE }}
              onClick={() => setLegalDoc(null)}
            />
            <motion.div
              className="relative z-10 flex max-h-[88vh] w-full max-w-2xl flex-col border border-white/[0.08] bg-[#0a0a0a]"
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={MODAL_PANEL_SPRING}
              role="dialog"
              aria-modal="true"
              aria-labelledby="legal-modal-title"
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] p-6 md:p-8">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-[#0066FF]">Légal</p>
                  <h2 id="legal-modal-title" className="mt-2 text-xl font-bold uppercase tracking-wide md:text-2xl">
                    {activeLegal.title}
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-white/40">{activeLegal.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLegalDoc(null)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-white/40 transition-colors hover:text-white"
                  aria-label="Fermer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="overflow-y-auto p-6 md:p-8">
                <div className="space-y-6">
                  {activeLegal.sections.map((section) => (
                    <section key={section.heading}>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-white/80">
                        {section.heading}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/45">{section.body}</p>
                    </section>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
