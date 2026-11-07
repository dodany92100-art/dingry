"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DingryLogo } from "@/components/atoms/dingry-logo";
import { DINGRY_STREET_LINE } from "@/lib/dingry-brand-voice";
import {
  DINGRY_COMPANY,
  DINGRY_CONTACT_EMAIL,
  DINGRY_REASSURANCE_LINE,
  DINGRY_RETURNS_ADDRESS,
} from "@/lib/dingry-legal";
import { LEGAL_DOCUMENTS, type LegalDocId } from "@/lib/legal-placeholders";

const MODAL_OVERLAY_EASE = [0.16, 1, 0.3, 1] as const;
const MODAL_PANEL_SPRING = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.85 };

const DINGRY_INSTAGRAM_URL = "https://www.instagram.com/dingry_officiel/";

const LEGAL_LINKS: { id: LegalDocId; label: string }[] = [
  { id: "mentions", label: "Mentions légales" },
  { id: "cgv", label: "CGV" },
  { id: "rgpd", label: "Confidentialité" },
  { id: "retours", label: "Retours" },
];

const SERVICE_LINES = [
  "Livraison offerte en France",
  "Retours gratuits sous 14 jours",
  "Paiement sécurisé · PayPal",
] as const;

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
    </svg>
  );
}

type ShopFooterProps = {
  onScrollToCatalogue?: () => void;
};

export function ShopFooter({ onScrollToCatalogue }: ShopFooterProps) {
  const [legalDoc, setLegalDoc] = useState<LegalDocId | null>(null);
  const activeLegal = legalDoc ? LEGAL_DOCUMENTS[legalDoc] : null;

  function goCatalogue() {
    if (onScrollToCatalogue) {
      onScrollToCatalogue();
      return;
    }
    document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <footer className="dingry-footer-stage dingry-footer-classic dingry-below-hero-surface relative border-t border-white/[0.08] py-14 md:py-16">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-12">
            <div className="lg:col-span-4">
              <DingryLogo animate={false} className="h-8 md:h-10" />
              <p className="dingry-typo-street dingry-typo-street--sm mt-4 text-white/90">{DINGRY_STREET_LINE}</p>
              <p className="mt-3 text-xs leading-relaxed tracking-[0.06em] text-white/45">{DINGRY_REASSURANCE_LINE}</p>
            </div>

            <div className="lg:col-span-2">
              <p className="dingry-footer-eyebrow">Boutique</p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <button
                    type="button"
                    onClick={goCatalogue}
                    className="dingry-footer-link text-left text-[11px] tracking-[0.12em]"
                  >
                    Catalogue
                  </button>
                </li>
                <li>
                  <a href="/checkout" className="dingry-footer-link text-[11px] tracking-[0.12em]">
                    Paiement
                  </a>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-3">
              <p className="dingry-footer-eyebrow">Service</p>
              <ul className="mt-4 space-y-2.5 text-xs leading-relaxed tracking-[0.06em] text-white/55 sm:text-[0.8125rem]">
                {SERVICE_LINES.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <span className="dingry-footer-dot mt-1.5 shrink-0" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-3" id="mentions-legales">
              <p className="dingry-footer-eyebrow">Contact</p>
              <ul className="mt-4 space-y-2.5 text-xs leading-relaxed tracking-[0.06em] text-white/55 sm:text-[0.8125rem]">
                <li>
                  <a href={`mailto:${DINGRY_CONTACT_EMAIL}`} className="dingry-footer-link text-white/85">
                    {DINGRY_CONTACT_EMAIL}
                  </a>
                </li>
                <li>
                  <a
                    href={DINGRY_INSTAGRAM_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="dingry-footer-link inline-flex items-center gap-2 text-white/85"
                  >
                    <InstagramIcon />
                    @dingry_officiel
                  </a>
                </li>
                <li className="text-white/40">
                  {DINGRY_COMPANY.legalName} · {DINGRY_COMPANY.registeredOffice}
                </li>
                <li className="text-white/35">Retours · {DINGRY_RETURNS_ADDRESS}</li>
              </ul>
            </div>
          </div>

          <nav className="dingry-footer-legal-rail mt-12" aria-label="Documents légaux">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="dingry-footer-eyebrow m-0">Légal</p>
              <ul className="flex flex-wrap items-center gap-y-2">
                {LEGAL_LINKS.map((link, index) => (
                  <li key={link.id} className="flex items-center">
                    {index > 0 ? (
                      <span className="mx-3 hidden h-3 w-px shrink-0 bg-white/10 sm:inline-block" aria-hidden />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setLegalDoc(link.id)}
                      className="dingry-footer-legal-link group"
                    >
                      <span className="dingry-footer-index mr-2 hidden opacity-60 transition-opacity group-hover:opacity-100 sm:inline">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="mt-8 flex flex-col items-center justify-between gap-6 border-t border-white/[0.06] pt-8 md:flex-row md:items-end">
            <div className="text-center md:text-left">
              <p className="dingry-footer-eyebrow text-white/45">Moyens de paiement</p>
              <ul className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start" aria-label="Moyens de paiement acceptés">
                {["PayPal", "Carte via PayPal"].map((method) => (
                  <li key={method} className="dingry-footer-chip dingry-footer-chip--ghost">
                    {method}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-center text-xs tracking-[0.08em] text-white/35 md:text-right">
              © <span suppressHydrationWarning>{new Date().getFullYear()}</span> DINGRY · Tous droits réservés
            </p>
          </div>
        </div>
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
