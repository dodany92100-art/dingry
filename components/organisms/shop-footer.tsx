"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Pencil } from "lucide-react";
import { DingryLogo } from "@/components/atoms/dingry-logo";
import { DingryContactModal } from "@/components/molecules/dingry-contact-modal";
import { DingryLegalDocModal } from "@/components/molecules/dingry-legal-doc-modal";
import { DingryNewsletterForm } from "@/components/molecules/dingry-newsletter-form";
import { DINGRY_LEGAL_CLOSING } from "@/lib/dingry-legal";
import { legalDocumentsForLocale, type LegalDocId } from "@/lib/legal-placeholders";
import { useTranslation } from "@/hooks/use-translation";
import { usePathname, useRouter } from "next/navigation";
import type { CatalogFilter } from "@/lib/catalog-category";
import { shopBasePathFromPathname, shopHref } from "@/lib/shop-base-path";
import { shopSectionHref } from "@/lib/shop-section-href";
import type { ShopBasePath } from "@/lib/shop-base-path";
import { BRAND_PAGE_SLUGS } from "@/lib/shop-brand-page-config";
import { shopBrandPageHref } from "@/lib/shop-brand-page-slug";
import { useShopStorefrontCopy } from "@/hooks/shop-storefront-copy-context";
import { AdminStorefrontCopyTrigger } from "@/components/molecules/shop/admin-storefront-copy-panel";
import {
  clampFooterColumnShift,
  DEFAULT_FOOTER_COLUMN_SHIFT,
  FOOTER_COLUMN_SHIFT_MAX,
  FOOTER_COLUMN_SHIFT_MIN,
  normalizeFooterColumnShift,
  type FooterColumnShift,
} from "@/lib/footer-column-shift";

const DINGRY_INSTAGRAM_URL = "https://www.instagram.com/dingry_officiel/";

const LEGAL_CLOSING_IDS = new Set<LegalDocId>(["cgv", "rgpd", "retours", "livraison", "expedition"]);

const FOOTER_LEGAL_LINKS: { id: LegalDocId; labelKey: "privacy" | "shipping" | "pricing" | "returns" }[] = [
  { id: "rgpd", labelKey: "privacy" },
  { id: "expedition", labelKey: "shipping" },
  { id: "livraison", labelKey: "pricing" },
  { id: "retours", labelKey: "returns" },
];

function FooterNavColumn({
  id,
  title,
  children,
  className = "",
  style,
}: {
  id?: string;
  title: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div id={id} className={`flex flex-col items-start text-left ${className}`} style={style}>
      <p className="dingry-footer-eyebrow mb-2 flex min-h-[2.125rem] items-end lg:min-h-[1.875rem]">{title}</p>
      <ul className="space-y-1.5">{children}</ul>
    </div>
  );
}

function PaymentMarks({ paymentAria }: { paymentAria: string }) {
  return (
    <ul className="m-0 flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-2" aria-label={paymentAria}>
      <li className="dingry-pay-badge" title="Mastercard">
        <svg viewBox="0 0 96 56" role="img" aria-label="Mastercard">
          <circle cx="40" cy="22" r="14" fill="#eb001b" />
          <circle cx="56" cy="22" r="14" fill="#f79e1b" />
          <path d="M48 10.7a14 14 0 0 1 0 22.6 14 14 0 0 1 0-22.6z" fill="#ff5f00" />
          <text
            x="48"
            y="52"
            textAnchor="middle"
            fill="#fff"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="11"
            fontWeight="600"
          >
            mastercard
          </text>
        </svg>
      </li>
      <li className="dingry-pay-badge" title="PayPal">
        <svg viewBox="0 0 96 56" role="img" aria-label="PayPal">
          <text
            x="48"
            y="36"
            textAnchor="middle"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="24"
            fontWeight="700"
            fontStyle="italic"
          >
            <tspan fill="#003087">Pay</tspan>
            <tspan fill="#009cde">Pal</tspan>
          </text>
        </svg>
      </li>
      <li className="dingry-pay-badge dingry-pay-badge--apple" title="Apple Pay">
        <svg viewBox="0 0 96 56" role="img" aria-label="Apple Pay">
          <path
            fill="#fff"
            transform="translate(8 12) scale(1.45)"
            d="M14.2 6.3c.6-.8 1-1.8.9-2.8-1 .1-2.1.6-2.8 1.4-.6.7-1.1 1.8-.9 2.8 1.1.1 2.1-.5 2.8-1.4zM16.4 8c-1.5-.1-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.3c.6-1.1.9-2.2 1.1-2.3-.1 0-2.3-.9-2.3-3.5 0-2.2 1.8-3.2 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-.1 0-.2 0-.2.1z"
          />
          <text x="66" y="36" textAnchor="middle" fill="#fff" fontFamily="Arial, Helvetica, sans-serif" fontSize="22" fontWeight="600">
            Pay
          </text>
        </svg>
      </li>
      <li className="dingry-pay-badge" title="Visa">
        <svg viewBox="0 0 96 56" role="img" aria-label="Visa">
          <path d="M22 14h14l-6 11z" fill="#f7a600" />
          <text
            x="52"
            y="38"
            textAnchor="middle"
            fill="#fff"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="28"
            fontWeight="800"
            fontStyle="italic"
          >
            VISA
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
  /** Curseurs de décalage, réservés à la session admin. */
  adminAdjust?: boolean;
};

function columnShiftStyle(px: number): CSSProperties {
  return { "--footer-shift": `${px}px` } as CSSProperties;
}

export function ShopFooter({
  onScrollToCatalogue,
  onScrollToSection,
  onSelectCatalogFilter: _onSelectCatalogFilter,
  onOpenAtelierCustom,
  shopBasePath: _shopBasePath = "/",
  adminAdjust = false,
}: ShopFooterProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const resolvedBase = _shopBasePath ?? shopBasePathFromPathname(pathname);
  const { locale, t } = useTranslation();
  const { copy } = useShopStorefrontCopy();
  const footerCopy = copy.footer;
  const [legalDoc, setLegalDoc] = useState<LegalDocId | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [columnShift, setColumnShift] = useState<FooterColumnShift>(DEFAULT_FOOTER_COLUMN_SHIFT);
  const [shiftStatus, setShiftStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [shiftDirty, setShiftDirty] = useState(false);
  const [shiftEditorOpen, setShiftEditorOpen] = useState(false);
  const shiftRef = useRef<FooterColumnShift>(DEFAULT_FOOTER_COLUMN_SHIFT);
  const shiftTouchedRef = useRef(false);
  const legalBundle = legalDocumentsForLocale(locale);
  const activeLegal = legalDoc ? legalBundle[legalDoc] : null;
  const legalClosing = locale === "en" ? t("footer.legalClosing") : DINGRY_LEGAL_CLOSING;

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/shop/footer-shift")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Partial<FooterColumnShift> | null) => {
        if (cancelled || !data || shiftTouchedRef.current) return;
        const next = normalizeFooterColumnShift(data);
        shiftRef.current = next;
        setColumnShift(next);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  function updateColumnShift(key: keyof FooterColumnShift, value: number) {
    const next = { ...shiftRef.current, [key]: clampFooterColumnShift(value) };
    shiftTouchedRef.current = true;
    shiftRef.current = next;
    setColumnShift(next);
    setShiftDirty(true);
    setShiftStatus("idle");
  }

  function saveColumnShift() {
    if (!adminAdjust || shiftStatus === "saving") return;
    setShiftStatus("saving");
    void fetch("/api/admin/shop/footer-shift", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(shiftRef.current),
    })
      .then((response) => {
        if (!response.ok) {
          setShiftStatus("error");
          return;
        }
        setShiftDirty(false);
        setShiftStatus("saved");
        setShiftEditorOpen(false);
      })
      .catch(() => setShiftStatus("error"));
  }

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
      <footer className="dingry-footer-stage dingry-footer-classic dingry-below-hero-surface dingry-gold-rule-top relative -mx-4 bg-[#050505] px-4 py-5 sm:-mx-6 sm:px-6 md:py-6 lg:-mx-8 lg:px-8">
        <div className="w-full">
          {adminAdjust ? (
            <div className="mb-2 flex items-center gap-1">
              <AdminStorefrontCopyTrigger mode="footer" ariaLabel="Modifier les textes du footer" />
            </div>
          ) : null}
          {adminAdjust ? (
            shiftEditorOpen ? (
              <div className="mb-5 grid gap-4 lg:grid-cols-3 lg:items-end">
                {(
                  [
                    ["marque", t("footer.brandColumn")],
                    ["boutique", t("footer.boutiqueColumn")],
                    ["legal", t("footer.legalModalEyebrow")],
                    ["logo", "Logo"],
                    ["instagram", "Instagram"],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="grid gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#c9a227]"
                  >
                    <span>
                      {label} · {columnShift[key]}px
                    </span>
                    <input
                      type="range"
                      min={FOOTER_COLUMN_SHIFT_MIN}
                      max={FOOTER_COLUMN_SHIFT_MAX}
                      step={1}
                      value={columnShift[key]}
                      aria-label={`Décalage horizontal de ${label}`}
                      className="dingry-footer-shift-range"
                      onChange={(event) => updateColumnShift(key, Number(event.target.value))}
                    />
                  </label>
                ))}
                <button
                  type="button"
                  className="h-11 min-w-28 border border-[#c9a227]/70 px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c9a227] disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={shiftStatus === "saving"}
                  onClick={() => {
                    if (!shiftDirty) {
                      setShiftEditorOpen(false);
                      return;
                    }
                    saveColumnShift();
                  }}
                >
                  {shiftStatus === "saving"
                    ? "Enregistrement"
                    : shiftDirty
                      ? shiftStatus === "error"
                        ? "Réessayer"
                        : "Enregistrer"
                      : "Fermer"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="mb-3 inline-flex h-9 w-9 items-center justify-center text-[#c9a227]"
                aria-label="Régler le placement du footer"
                onClick={() => setShiftEditorOpen(true)}
              >
                <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              </button>
            )
          ) : null}
          <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start sm:gap-x-12 lg:gap-x-16">
            <div className="dingry-footer-brand flex flex-col items-center text-center sm:self-stretch sm:justify-between">
              <div
                className="dingry-footer-col-shift flex w-full flex-col items-center"
                style={columnShiftStyle(columnShift.logo)}
              >
                <DingryLogo animate={false} tone="on-dark" className="h-10 w-auto max-md:max-h-none md:h-[3.1rem]" />
                <p className="dingry-typo-manifesto mt-1.5 max-w-[14rem] text-center text-[10px] text-[#161616]/52">
                  {footerCopy.manifesto}
                </p>
              </div>
              <a
                href={DINGRY_INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="dingry-footer-col-shift dingry-catalog-custom-tab dingry-nav-custom-tab dingry-interactive-luxe mt-6 inline-flex min-h-11 shrink-0 items-center gap-2 px-3.5 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] sm:mt-8 md:mt-10 lg:mt-0 lg:px-4 lg:text-[10px] lg:tracking-[0.18em]"
                style={columnShiftStyle(columnShift.instagram)}
              >
                <InstagramIcon />
                <span className="gold-text normal-case">@dingry_officiel</span>
              </a>
            </div>

            <div className="grid w-full max-w-full grid-cols-2 items-start justify-items-start gap-x-8 gap-y-4 sm:ms-auto sm:w-max sm:justify-self-end lg:grid-cols-[max-content_max-content_max-content] lg:gap-x-14">
            <FooterNavColumn
              title={footerCopy.brandColumn}
              className="dingry-footer-col-shift max-sm:row-start-3"
              style={columnShiftStyle(columnShift.marque)}
            >
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
              {BRAND_PAGE_SLUGS.map((slug) => (
                <li key={slug}>
                  <button
                    type="button"
                    onClick={() => router.push(shopBrandPageHref(resolvedBase, slug))}
                    className={`${boutiqueLinkClass} text-white/40`}
                  >
                    {t(`brandPages.links.${slug}`)}
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onClick={() => setContactOpen(true)} className={boutiqueLinkClass}>
                  {t("footer.navContact")}
                </button>
              </li>
            </FooterNavColumn>

            <FooterNavColumn
              title={footerCopy.boutiqueColumn}
              className="dingry-footer-col-shift"
              style={columnShiftStyle(columnShift.boutique)}
            >
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

            <FooterNavColumn
              id="mentions-legales"
              title={footerCopy.legalColumn}
              className="dingry-footer-col-shift max-sm:col-start-2 max-sm:row-start-3"
              style={columnShiftStyle(columnShift.legal)}
            >
              <li>
                <button type="button" onClick={() => setLegalDoc("mentions")} className={boutiqueLinkClass}>
                  {t("footer.infoColumn")}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setLegalDoc("cgv")} className={boutiqueLinkClass}>
                  {t("footer.legalLinks.cgv")}
                </button>
              </li>
              {FOOTER_LEGAL_LINKS.map(({ id, labelKey }) => (
                <li key={id}>
                  <button type="button" onClick={() => setLegalDoc(id)} className={boutiqueLinkClass}>
                    {t(`footer.legalLinks.${labelKey}`)}
                  </button>
                </li>
              ))}
            </FooterNavColumn>
            </div>
          </div>

          <div className="dingry-footer-newsletter-stage mt-6 flex w-full justify-center md:mt-7">
            <div className="mx-auto w-full max-w-5xl px-1 sm:px-2">
              <DingryNewsletterForm align="center" inline />
            </div>
          </div>

          <section
            className="dingry-footer-payment-band dingry-gold-rule-top -mx-4 mt-4 flex w-full flex-col items-center bg-[#050505] px-4 pt-4 sm:-mx-6 sm:px-6 md:mt-5 lg:-mx-8 lg:px-8"
            aria-label={t("footer.paymentSectionAria")}
          >
            <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 text-center">
              <p className="dingry-footer-eyebrow dingry-footer-payment-band__eyebrow m-0 w-full text-center tracking-[0.22em]">
                {t("footer.paymentEyebrow")}
              </p>
              <PaymentMarks paymentAria={t("cart.paymentMethodsAria")} />
              <p className="dingry-footer-payment-band__copy w-full pb-1 text-center text-[10px] tracking-[0.08em]">
                {t("footer.copyrightLead", { year: new Date().getFullYear() })}{" "}
                <span className="dingry-footer-payment-band__rights">{t("footer.copyrightRights")}</span>
              </p>
            </div>
          </section>
        </div>
      </footer>

      <DingryContactModal open={contactOpen} onClose={() => setContactOpen(false)} />

      <DingryLegalDocModal
        open={Boolean(activeLegal && legalDoc)}
        legalDocId={legalDoc}
        document={activeLegal}
        legalModalEyebrow={t("footer.legalModalEyebrow")}
        closeAriaLabel={t("common.close")}
        showLegalClosing={Boolean(legalDoc && LEGAL_CLOSING_IDS.has(legalDoc))}
        legalClosing={legalClosing}
        onClose={() => setLegalDoc(null)}
      />
    </>
  );
}
