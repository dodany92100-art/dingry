"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import {
  DINGRY_MANIFESTO_FR,
  DINGRY_STREET_LINE,
} from "@/lib/dingry-brand-voice";
import {
  DINGRY_COMPANY,
  DINGRY_CONTACT_EMAIL,
  DINGRY_CONTACT_PHONE,
  DINGRY_REASSURANCE_LINE,
  DINGRY_RETURNS_ADDRESS,
} from "@/lib/dingry-legal";
import { LEGAL_DOCUMENTS, type LegalDocId } from "@/lib/legal-placeholders";

const MODAL_OVERLAY_EASE = [0.16, 1, 0.3, 1] as const;
const MODAL_PANEL_SPRING = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.85 };

const DINGRY_INSTAGRAM_URL = "https://www.instagram.com/dingry_officiel/";

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
    </svg>
  );
}

type FooterCardProps = {
  children: ReactNode;
  eyebrow: string;
  footer?: ReactNode;
  id?: string;
  index: string;
  variant?: "default" | "pulse" | "legal";
};

function FooterCard({ children, eyebrow, footer, id, index, variant = "default" }: FooterCardProps) {
  return (
    <article
      id={id}
      className={cn(
        "dingry-footer-block group",
        variant === "pulse" && "dingry-footer-block--pulse",
        variant === "legal" && "dingry-footer-block--legal",
      )}
    >
      <div className="dingry-footer-block__shine" aria-hidden />
      <header className="relative z-[1] flex items-center justify-between gap-3">
        <p className="dingry-footer-eyebrow">{eyebrow}</p>
        <span className="dingry-footer-index" aria-hidden>
          {index}
        </span>
      </header>
      <div className="relative z-[1] mt-5 flex min-h-0 flex-1 flex-col justify-center">{children}</div>
      {footer ? <footer className="dingry-footer-card-foot relative z-[1]">{footer}</footer> : null}
    </article>
  );
}

type FooterMarqueeProps = {
  onOpenLegal: (id: LegalDocId) => void;
  withLegalAnchor?: boolean;
};

function FooterMarqueeBlocks({ onOpenLegal, withLegalAnchor }: FooterMarqueeProps) {
  const legalLinks: { id: LegalDocId; label: string }[] = [
    { id: "mentions", label: "Mentions" },
    { id: "cgv", label: "CGV" },
    { id: "rgpd", label: "RGPD" },
  ];

  return (
    <>
      <FooterCard eyebrow="Signal" index="01" variant="pulse">
        <p className="dingry-typo-manifesto text-[10px] text-white/90 sm:text-[11px]">{DINGRY_MANIFESTO_FR}</p>
        <p className="dingry-typo-street dingry-typo-street--sm mt-4 text-white">{DINGRY_STREET_LINE}</p>
        <p className="mt-4 text-[10px] uppercase tracking-[0.24em] text-white/40">DINGRY Paris</p>
      </FooterCard>

      <FooterCard
        eyebrow="Réseau"
        index="02"
        footer={
          <a
            href={DINGRY_INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="dingry-footer-link inline-flex items-center gap-2"
            aria-label="Instagram @dingry_officiel"
          >
            <InstagramIcon />
            @dingry_officiel
          </a>
        }
      >
        <p className="text-[11px] uppercase tracking-[0.26em] text-white/85">Paris · Lyon</p>
        <p className="mt-3 text-[10px] leading-[1.8] tracking-[0.16em] text-white/45">Streetwear en édition limitée.</p>
      </FooterCard>

      <FooterCard eyebrow="Contact" index="03">
        <ul className="space-y-2.5 text-[10px] leading-relaxed tracking-[0.14em] text-white/55">
          <li>
            <a href={`mailto:${DINGRY_CONTACT_EMAIL}`} className="dingry-footer-link text-white/85">
              {DINGRY_CONTACT_EMAIL}
            </a>
          </li>
          <li>{DINGRY_CONTACT_PHONE}</li>
          <li className="text-white/35">
            {DINGRY_COMPANY.legalName} · {DINGRY_COMPANY.registeredOffice}
          </li>
          <li className="text-white/30">Retours · {DINGRY_RETURNS_ADDRESS}</li>
        </ul>
      </FooterCard>

      <FooterCard eyebrow="Logistique" index="04" variant="pulse">
        <ul className="space-y-2 text-[10px] leading-[1.75] tracking-[0.15em] text-white/50">
          <li className="flex items-center gap-2">
            <span className="dingry-footer-dot" aria-hidden />
            Livraison offerte en France
          </li>
          <li className="flex items-center gap-2">
            <span className="dingry-footer-dot" aria-hidden />
            Retours gratuits sous 14 jours
          </li>
          <li className="flex items-center gap-2">
            <span className="dingry-footer-dot" aria-hidden />
            Pièces numérotées
          </li>
        </ul>
      </FooterCard>

      <FooterCard eyebrow="Légal" index="05" variant="legal" id={withLegalAnchor ? "mentions-legales" : undefined}>
        <p className="mb-4 text-[10px] leading-[1.7] tracking-[0.12em] text-white/40">{DINGRY_REASSURANCE_LINE}</p>
        <div className="flex flex-wrap gap-2">
          {legalLinks.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => onOpenLegal(link.id)}
              className="dingry-footer-chip"
            >
              {link.label}
            </button>
          ))}
        </div>
      </FooterCard>
    </>
  );
}

export function ShopFooter() {
  const [legalDoc, setLegalDoc] = useState<LegalDocId | null>(null);
  const activeLegal = legalDoc ? LEGAL_DOCUMENTS[legalDoc] : null;

  return (
    <>
      <footer className="dingry-footer-stage dingry-below-hero-surface relative overflow-hidden border-t border-white/[0.06] px-0 py-14 md:py-16">
        <InfiniteMovingCards ariaLabel="Informations boutique" durationSeconds={52}>
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-stretch gap-5 md:gap-8" aria-hidden={copy === 1}>
              <FooterMarqueeBlocks onOpenLegal={setLegalDoc} withLegalAnchor={copy === 0} />
            </div>
          ))}
        </InfiniteMovingCards>

        <div className="relative z-[1] mt-12 border-t border-white/[0.06] px-6 pt-8 md:px-12">
          <p className="mb-4 text-center text-[10px] uppercase tracking-[0.32em] text-white/35">Moyens de paiement</p>
          <ul className="flex flex-wrap items-center justify-center gap-3" aria-label="Moyens de paiement acceptés">
            {["PayPal", "Carte via PayPal"].map((method) => (
              <li key={method} className="dingry-footer-chip dingry-footer-chip--ghost">
                {method}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex justify-center">
          <a
            href={DINGRY_INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="dingry-footer-link inline-flex items-center gap-2.5"
            aria-label="Instagram @dingry_officiel"
          >
            <InstagramIcon />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em]">@dingry_officiel</span>
          </a>
        </div>

        <p className="mt-6 px-6 text-center text-[10px] tracking-[0.28em] text-white/25 md:px-12">
          © <span suppressHydrationWarning>{new Date().getFullYear()}</span> DINGRY. Tous droits réservés.
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
