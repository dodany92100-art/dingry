"use client";

import { useState, type ReactNode } from "react";
import { DingryLogo } from "@/components/atoms/dingry-logo";
import { DingryContactModal } from "@/components/molecules/dingry-contact-modal";
import { DingryNewsletterForm } from "@/components/molecules/dingry-newsletter-form";
import { DINGRY_LEGAL_CLOSING } from "@/lib/dingry-legal";
import { legalDocumentsForLocale, type LegalDocId } from "@/lib/legal-placeholders";
import { useTranslation } from "@/hooks/use-translation";
import { usePathname, useRouter } from "next/navigation";
import type { CatalogFilter } from "@/lib/catalog-category";
import { shopBasePathFromPathname, shopHref } from "@/lib/shop-base-path";
import { shopSectionHref } from "@/lib/shop-section-href";
import type { ShopBasePath } from "@/lib/shop-base-path";

const DINGRY_INSTAGRAM_URL = "https://www.instagram.com/dingry_officiel/";

const LEGAL_CLOSING_IDS = new Set<LegalDocId>(["cgv", "rgpd", "retours", "livraison", "expedition"]);

const FOOTER_LEGAL_LINKS: { id: LegalDocId; labelKey: "privacy" | "shipping" | "pricing" | "returns" }[] = [
  { id: "rgpd", labelKey: "privacy" },
  { id: "expedition", labelKey: "shipping" },
  { id: "livraison", labelKey: "pricing" },
  { id: "retours", labelKey: "returns" },
];

function FooterNavColumn({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-start text-left ${className}`}>
      <p className="dingry-footer-eyebrow mb-2 flex min-h-[2.125rem] items-end lg:min-h-[1.875rem]">{title}</p>
      <ul className="space-y-1.5">{children}</ul>
    </div>
  );
}

function PaymentMarks({ paymentAria }: { paymentAria: string }) {
  return (
    <ul className="mt-0 flex flex-wrap items-center justify-center gap-2" aria-label={paymentAria}>
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
  onSelectCatalogFilter?: (filter: CatalogFilter) => void;
  onOpenAtelierCustom?: () => void;
  shopBasePath?: ShopBasePath;
};

export function ShopFooter({
  onScrollToCatalogue,
  onScrollToSection,
  onSelectCatalogFilter: _onSelectCatalogFilter,
  onOpenAtelierCustom,
  shopBasePath: _shopBasePath = "/",
}: ShopFooterProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const resolvedBase = _shopBasePath ?? shopBasePathFromPathname(pathname);
  const { locale, t } = useTranslation();
  const [legalDoc, setLegalDoc] = useState<LegalDocId | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const legalBundle = legalDocumentsForLocale(locale);
  const activeLegal = legalDoc ? legalBundle[legalDoc] : null;
  const legalClosing = locale === "en" ? t("footer.legalClosing") : DINGRY_LEGAL_CLOSING;

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

  const boutiqueLinkClass =
    "dingry-footer-link block w-full text-left text-xs leading-snug tracking-[0.12em] transition-colors";

  function goAtelierCustom() {
    if (onOpenAtelierCustom) {
      onOpenAtelierCustom();
      return;
    }
    scrollToSection("atelier-custom");
  }

  function goHeritage() {
    if (pathname.includes("/heritage")) {
      scrollToSection("heritage-top");
      return;
    }
    router.push(shopHref(resolvedBase, "/heritage"));
  }

  function goLookbook() {
    if (pathname.includes("/heritage")) {
      router.push(shopSectionHref(resolvedBase, "lookbook"));
      return;
    }
    scrollToSection("lookbook");
  }

  return (
    <>
      <footer className="dingry-footer-stage dingry-footer-classic dingry-below-hero-surface dingry-gold-rule-top relative py-5 md:py-6">
        <div className="w-full">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:gap-x-8 lg:grid-cols-4 lg:items-start lg:gap-x-8 lg:gap-y-5 xl:gap-x-10">
            <div className="col-span-2 flex flex-col items-start text-left sm:col-span-1">
              <DingryLogo animate={false} tone="on-light" className="h-10 w-auto max-md:max-h-none md:h-[3.1rem]" />
              <p className={`dingry-typo-manifesto mt-1.5 max-w-[14rem] text-[10px] text-[#161616]/52`}>
                {t("footer.manifesto")}
              </p>
              <a
                href={DINGRY_INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="dingry-footer-instagram-cta dingry-footer-instagram-plaque dingry-footer-instagram-plaque--footer mt-2"
              >
                <InstagramIcon />
                <span className="dingry-footer-instagram-cta__handle dingry-footer-instagram-plaque__handle">
                  <span className="gold-text">@dingry_officiel</span>
                </span>
              </a>
            </div>

            <FooterNavColumn title={t("footer.boutiqueColumn")}>
              <li>
                <button type="button" onClick={() => goCatalogue()} className={boutiqueLinkClass}>
                  {t("footer.navCollection")}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => goAtelierCustom()} className={boutiqueLinkClass}>
                  {t("nav.atelier")}
                </button>
              </li>
            </FooterNavColumn>

            <FooterNavColumn title={t("footer.brandColumn")} className="max-sm:col-span-2">
              <li>
                <button type="button" onClick={() => goHeritage()} className={boutiqueLinkClass}>
                  {t("nav.heritage")}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => goLookbook()} className={boutiqueLinkClass}>
                  {t("nav.lookbook")}
                </button>
              </li>
            </FooterNavColumn>

            <div id="mentions-legales" className="flex flex-col items-start text-left">
              <div className="dingry-footer-legal-head mb-2 flex min-h-[2.125rem] flex-wrap items-end gap-x-3 gap-y-0.5 lg:min-h-[1.875rem] lg:items-baseline">
                <button
                  type="button"
                  onClick={() => setLegalDoc("mentions")}
                  className="dingry-footer-eyebrow dingry-footer-legal-head__title m-0"
                >
                  {t("footer.infoColumn")}
                </button>
                <button
                  type="button"
                  onClick={() => setLegalDoc("cgv")}
                  className="dingry-footer-eyebrow dingry-footer-legal-head__title m-0"
                >
                  {t("footer.legalLinks.cgv")}
                </button>
              </div>
              <ul className="space-y-1.5">
                {FOOTER_LEGAL_LINKS.map(({ id, labelKey }) => (
                  <li key={id}>
                    <button type="button" onClick={() => setLegalDoc(id)} className={boutiqueLinkClass}>
                      {t(`footer.legalLinks.${labelKey}`)}
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" onClick={() => setContactOpen(true)} className={boutiqueLinkClass}>
                    {t("footer.navContact")}
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="dingry-footer-newsletter-stage mt-6 flex w-full justify-center md:mt-7">
            <div className="w-full max-w-[22rem] sm:max-w-[26rem]">
              <DingryNewsletterForm align="center" />
            </div>
          </div>

          <section
            className="dingry-gold-rule-top mt-5 flex w-full flex-col gap-3 pt-4 md:mt-6"
            aria-label={t("footer.paymentSectionAria")}
          >
            <div className="flex w-full flex-col items-center gap-3 text-center">
              <div className="flex w-full flex-col items-center">
                <p className="dingry-footer-eyebrow m-0 text-[#161616]/60">{t("footer.paymentEyebrow")}</p>
                <div className="mt-2 flex w-full justify-center">
                  <PaymentMarks paymentAria={t("cart.paymentMethodsAria")} />
                </div>
              </div>
              <p className="pb-1 text-[10px] tracking-[0.08em] text-[#161616]/55">
                {t("footer.copyright", { year: new Date().getFullYear() })}
              </p>
            </div>
          </section>
        </div>
      </footer>

      <DingryContactModal open={contactOpen} onClose={() => setContactOpen(false)} />

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
                  <p className="dingry-section-eyebrow">{t("footer.legalModalEyebrow")}</p>
                  <h2 id="legal-modal-title" className="mt-2 text-xl font-bold uppercase tracking-wide md:text-2xl">
                    {activeLegal.title}
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-white/40">{activeLegal.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLegalDoc(null)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-white/40 transition-colors hover:text-white"
                  aria-label={t("common.close")}
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
                    {legalClosing}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
      ) : null}
    </>
  );
}
