"use client";

import Link from "next/link";
import { useState } from "react";
import { DingryLogo } from "@/components/atoms/dingry-logo";
import { DingryContactForm } from "@/components/molecules/dingry-contact-form";
import { DingryNewsletterForm } from "@/components/molecules/dingry-newsletter-form";
import { DINGRY_LEGAL_CLOSING } from "@/lib/dingry-legal";
import { LEGAL_DOCUMENTS, type LegalDocId } from "@/lib/legal-placeholders";
import { shopHref, type ShopBasePath } from "@/lib/shop-base-path";

const DINGRY_INSTAGRAM_URL = "https://www.instagram.com/dingry_officiel/";

const MENTIONS_LEGALES_LINKS: { id: LegalDocId; label: string }[] = [
  { id: "cgv", label: "CGV" },
  { id: "livraison", label: "Frais de livraison" },
  { id: "rgpd", label: "Confidentialité" },
  { id: "retours", label: "Retours" },
];

const LEGAL_CLOSING_IDS = new Set<LegalDocId>(["cgv", "rgpd", "retours", "livraison"]);

function PaymentMarks() {
  return (
            <ul className="mt-0 flex flex-wrap items-center justify-center gap-2 sm:justify-start" aria-label="Moyens de paiement acceptés">
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
    </svg>
  );
}

type ShopFooterProps = {
  onScrollToCatalogue?: () => void;
  onScrollToSection?: (sectionId: string) => void;
  onOpenHeritage?: () => void;
  shopBasePath?: ShopBasePath;
};

export function ShopFooter({
  onScrollToCatalogue,
  onScrollToSection,
  onOpenHeritage,
  shopBasePath: _shopBasePath = "/",
}: ShopFooterProps) {
  const [legalDoc, setLegalDoc] = useState<LegalDocId | null>(null);
  const activeLegal = legalDoc ? LEGAL_DOCUMENTS[legalDoc] : null;

  function scrollToSection(sectionId: string) {
    if (onScrollToSection) {
      onScrollToSection(sectionId);
      return;
    }
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  }

  function goCatalogue() {
    if (onScrollToCatalogue) {
      onScrollToCatalogue();
      return;
    }
    scrollToSection("catalogue");
  }

  return (
    <>
      <footer className="dingry-footer-stage dingry-footer-classic dingry-below-hero-surface dingry-gold-rule-top relative py-10 md:py-12">
        <div className="w-full">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-x-10">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between lg:col-span-5 lg:flex-col lg:justify-start">
              <div>
                <DingryLogo animate={false} tone="on-light" className="h-10 w-auto max-md:max-h-none md:h-12" />
                <a
                  href={DINGRY_INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="dingry-footer-instagram-inline mt-4 inline-flex items-center gap-2 text-sm tracking-[0.14em]"
                >
                  <InstagramIcon />
                  <span>@dingry_officiel</span>
                </a>
              </div>
              <nav aria-label="Navigation boutique">
                <p className="dingry-footer-eyebrow mb-3">Boutique</p>
                <ul className="space-y-2">
                  <li>
                    <button type="button" onClick={goCatalogue} className="dingry-footer-link text-left text-[11px] tracking-[0.12em]">
                      Collection
                    </button>
                  </li>
                  <li>
                    {onOpenHeritage ? (
                      <button
                        type="button"
                        onClick={onOpenHeritage}
                        className="dingry-footer-link text-left text-[11px] tracking-[0.12em]"
                      >
                        Héritage
                      </button>
                    ) : (
                      <Link
                        href={shopHref(_shopBasePath, "/?heritage=1")}
                        className="dingry-footer-link text-left text-[11px] tracking-[0.12em]"
                      >
                        Héritage
                      </Link>
                    )}
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => scrollToSection("lookbook")}
                      className="dingry-footer-link text-left text-[11px] tracking-[0.12em]"
                    >
                      Lookbook
                    </button>
                  </li>
                </ul>
              </nav>
              <div id="mentions-legales">
                <p className="dingry-footer-eyebrow">Mentions légales</p>
                <ul className="mt-3 space-y-2">
                  {MENTIONS_LEGALES_LINKS.map((link) => (
                    <li key={link.id}>
                      <button
                        type="button"
                        onClick={() => setLegalDoc(link.id)}
                        className="dingry-footer-legal-link dingry-footer-legal-link--compact text-left"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-8 lg:col-span-7">
              <DingryNewsletterForm />
              <DingryContactForm />
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center gap-3 border-t border-black/10 pt-6 sm:flex-row sm:justify-between">
            <div className="flex flex-col items-center gap-2 sm:items-start">
              <p className="dingry-footer-eyebrow m-0 text-[#161616]/60">Paiement</p>
              <PaymentMarks />
            </div>
            <p className="text-center text-[10px] tracking-[0.08em] text-[#161616]/55 sm:text-right">
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
