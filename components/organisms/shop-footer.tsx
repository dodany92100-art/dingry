"use client";

import { useState } from "react";
import { DingryLogo } from "@/components/atoms/dingry-logo";
import { DINGRY_CONTACT_EMAIL, DINGRY_LEGAL_CLOSING, DINGRY_REASSURANCE_LINE } from "@/lib/dingry-legal";
import { LEGAL_DOCUMENTS, type LegalDocId } from "@/lib/legal-placeholders";
import { shopHref, type ShopBasePath } from "@/lib/shop-base-path";

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

const LEGAL_CLOSING_IDS = new Set<LegalDocId>(["cgv", "rgpd", "retours"]);

function PaymentMarks() {
  return (
    <ul className="mt-3 flex flex-wrap items-center justify-center gap-2 md:justify-start" aria-label="Moyens de paiement acceptés">
      <li className="dingry-pay-badge" title="PayPal">
        <svg viewBox="0 0 88 24" width="72" height="20" role="img" aria-label="PayPal">
          <text x="0" y="18" fill="#003087" fontFamily="Arial, Helvetica, sans-serif" fontSize="16" fontWeight="700" fontStyle="italic">
            Pay
          </text>
          <text x="34" y="18" fill="#009cde" fontFamily="Arial, Helvetica, sans-serif" fontSize="16" fontWeight="700" fontStyle="italic">
            Pal
          </text>
        </svg>
      </li>
      <li className="dingry-pay-badge" title="Visa">
        <svg viewBox="0 0 64 24" width="52" height="20" role="img" aria-label="Visa">
          <text x="2" y="18" fill="#1a1f71" fontFamily="Arial, Helvetica, sans-serif" fontSize="18" fontWeight="800" fontStyle="italic" letterSpacing="1">
            VISA
          </text>
        </svg>
      </li>
      <li className="dingry-pay-badge" title="Mastercard">
        <svg viewBox="0 0 40 24" width="40" height="24" role="img" aria-label="Mastercard">
          <circle cx="15" cy="12" r="8" fill="#eb001b" />
          <circle cx="25" cy="12" r="8" fill="#f79e1b" />
          <path d="M20 6.2a8 8 0 0 1 0 11.6 8 8 0 0 1 0-11.6z" fill="#ff5f00" />
        </svg>
      </li>
      <li className="dingry-pay-badge" title="Apple Pay">
        <svg viewBox="0 0 78 24" width="68" height="20" role="img" aria-label="Apple Pay">
          <path
            fill="#111"
            d="M14.2 6.3c.6-.8 1-1.8.9-2.8-1 .1-2.1.6-2.8 1.4-.6.7-1.1 1.8-.9 2.8 1.1.1 2.1-.5 2.8-1.4zM16.4 8c-1.5-.1-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.3c.6-1.1.9-2.2 1.1-2.3-.1 0-2.3-.9-2.3-3.5 0-2.2 1.8-3.2 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-.1 0-.2 0-.2.1z"
          />
          <text x="22" y="17" fill="#111" fontFamily="Arial, Helvetica, sans-serif" fontSize="13" fontWeight="600">
            Pay
          </text>
        </svg>
      </li>
    </ul>
  );
}

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
  shopBasePath?: ShopBasePath;
};

export function ShopFooter({ onScrollToCatalogue, shopBasePath = "/" }: ShopFooterProps) {
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
      <footer className="dingry-footer-stage dingry-footer-classic dingry-below-hero-surface dingry-gold-rule-top relative py-14 md:py-16">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-12">
            <div className="lg:col-span-4">
              <DingryLogo animate={false} className="h-8 md:h-10" />
              <p className="mt-4 text-xs leading-relaxed tracking-[0.06em] text-[#161616]/75">{DINGRY_REASSURANCE_LINE}</p>
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
                  <a
                    href={shopHref(shopBasePath, "/checkout")}
                    className="dingry-footer-link text-[11px] tracking-[0.12em]"
                  >
                    Paiement
                  </a>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-3">
              <p className="dingry-footer-eyebrow">Services</p>
              <ul className="mt-4 space-y-2.5 text-xs leading-relaxed tracking-[0.06em] text-[#161616]/75 sm:text-[0.8125rem]">
                {SERVICE_LINES.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <span className="dingry-footer-dot dingry-footer-dot--gold mt-1.5 shrink-0" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-3" id="mentions-legales">
              <p className="dingry-footer-eyebrow">Contact</p>
              <ul className="mt-4 space-y-2.5 text-xs leading-relaxed tracking-[0.06em] text-[#161616]/75 sm:text-[0.8125rem]">
                <li>
                  <a href={`mailto:${DINGRY_CONTACT_EMAIL}`} className="dingry-footer-link text-[#161616]">
                    {DINGRY_CONTACT_EMAIL}
                  </a>
                </li>
                <li>
                  <a
                    href={DINGRY_INSTAGRAM_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="dingry-footer-link inline-flex items-center gap-2 text-[#161616]"
                  >
                    <InstagramIcon />
                    @dingry_officiel
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <nav className="dingry-footer-legal-rail mt-12 border-black/10" aria-label="Documents légaux">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="dingry-footer-eyebrow m-0">Légal</p>
              <ul className="flex flex-wrap items-center gap-y-2">
                {LEGAL_LINKS.map((link, index) => (
                  <li key={link.id} className="flex items-center">
                    {index > 0 ? (
                      <span className="mx-3 hidden h-3 w-px shrink-0 bg-black/15 sm:inline-block" aria-hidden />
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

          <div className="mt-8 flex flex-col items-center justify-between gap-6 border-t border-black/10 pt-8 md:flex-row md:items-end">
            <div className="text-center md:text-left">
              <p className="dingry-footer-eyebrow text-[#161616]/60">Moyens de paiement</p>
              <PaymentMarks />
            </div>
            <p className="text-center text-xs tracking-[0.08em] text-[#161616]/55 md:text-right">
              © <span suppressHydrationWarning>{new Date().getFullYear()}</span> DINGRY · Tous droits réservés
            </p>
          </div>
        </div>
      </footer>

      {activeLegal && legalDoc ? (
          <div
            key={`legal-${legalDoc}`}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8"
          >
            <div
              className="dingry-legal-overlay absolute inset-0 bg-[#050505]/92"
              onClick={() => setLegalDoc(null)}
            />
            <div
              className="dingry-legal-panel relative z-10 flex max-h-[88vh] w-full max-w-2xl flex-col border border-white/[0.08] bg-[#0a0a0a]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="legal-modal-title"
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] p-6 md:p-8">
                <div>
                  <p className="dingry-section-eyebrow">Légal</p>
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
                {LEGAL_CLOSING_IDS.has(legalDoc) ? (
                  <p className="dingry-gold-rule-top relative mt-8 block pt-4 text-sm tracking-normal text-white/90 normal-case">
                    {DINGRY_LEGAL_CLOSING}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
      ) : null}
    </>
  );
}
