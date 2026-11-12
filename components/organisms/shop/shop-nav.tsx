"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CircleUser, Heart, Menu, X } from "lucide-react";
import { motion, useAnimation, useReducedMotion } from "motion/react";
import { useFlyAnimationOptional } from "@/hooks/use-fly-animation";
import { DingryLogo } from "@/components/atoms/dingry-logo";
import { DINGRY_SHOP_SHELL_CLASS } from "@/components/organisms/shop/catalog-layout";
import { shopHref, type ShopBasePath } from "@/lib/shop-base-path";
import { shopSectionHref } from "@/lib/shop-section-href";
import { CATALOG_MENU_TAB_CUSTOM } from "@/lib/shop-catalog";
import { cn } from "@/lib/utils";
import { DingryLocaleToggle } from "@/components/atoms/dingry-locale-toggle";
import { useTranslation } from "@/hooks/use-translation";

const SECTIONS = [
  ["catalogue", "nav.collection"],
  ["atelier-custom", "nav.atelier"],
  ["heritage", "nav.heritage"],
  ["lookbook", "nav.lookbook"],
] as const;

type ShopNavSectionId = (typeof SECTIONS)[number][0];

function ShopNavActions({
  cartCount,
  favoriteCount,
  accountActive,
  onOpenAccount,
  onOpenFavorites,
  onOpenCart,
  favorisControls,
  cartControls,
}: {
  cartCount: number;
  favoriteCount: number;
  accountActive?: boolean;
  onOpenAccount?: () => void;
  onOpenFavorites?: () => void;
  onOpenCart: () => void;
  favorisControls: ReturnType<typeof useAnimation>;
  cartControls: ReturnType<typeof useAnimation>;
}) {
  const { t } = useTranslation();

  return (
    <>
      {onOpenAccount ? (
        <button
          type="button"
          onClick={onOpenAccount}
          aria-label={accountActive ? t("nav.accountConnected") : t("nav.signIn")}
          className="dingry-interactive-luxe hidden h-10 w-10 items-center justify-center rounded-sm border border-white/20 bg-white/[0.06] text-white/75 hover:bg-white/[0.1] hover:text-white md:flex"
        >
          <CircleUser
            size={20}
            strokeWidth={1.75}
            className={accountActive ? "text-[#fcf6ba]" : "stroke-current"}
            aria-hidden
          />
        </button>
      ) : null}
      {onOpenFavorites ? (
        <button
          type="button"
          data-fly-target="favorites"
          onClick={onOpenFavorites}
          aria-label={
            favoriteCount > 0
              ? t(favoriteCount > 1 ? "nav.favoritesOther" : "nav.favoritesOne", { count: favoriteCount })
              : t("nav.browseFavorites")
          }
          className="dingry-nav-favoris-btn dingry-interactive-luxe relative flex h-10 w-10 items-center justify-center rounded-sm border border-white/20 bg-white/[0.06] text-white/75 hover:bg-white/[0.1] hover:text-white"
        >
          <motion.span animate={favorisControls} className="inline-flex">
            <Heart
              size={20}
              strokeWidth={1.75}
              className={
                favoriteCount > 0 ? "dingry-nav-favoris-heart--on" : "fill-none stroke-current text-white/75"
              }
              aria-hidden
            />
          </motion.span>
          {favoriteCount > 0 ? (
            <span className="dingry-nav-favoris-badge absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-sm px-1 text-[10px] font-bold tabular-nums leading-none">
              {favoriteCount}
            </span>
          ) : null}
        </button>
      ) : null}
      <button
        type="button"
        data-fly-target="cart"
        onClick={onOpenCart}
        aria-label={
          cartCount > 0
            ? t(cartCount > 1 ? "nav.cartOther" : "nav.cartOne", { count: cartCount })
            : t("nav.openCart")
        }
        className="dingry-interactive-luxe dingry-nav-cart-btn relative flex h-10 w-10 items-center justify-center rounded-sm border border-white/20 bg-white/[0.06] text-white/90 hover:bg-white/[0.1] hover:text-white"
      >
        <motion.span animate={cartControls} className="inline-flex">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="9" cy="20" r="1.25" fill="currentColor" stroke="none" />
            <circle cx="17" cy="20" r="1.25" fill="currentColor" stroke="none" />
            <path d="M2 3h2.2l2.4 12.4a1.5 1.5 0 0 0 1.48 1.22h9.56a1.5 1.5 0 0 0 1.47-1.18L21 7H6" />
          </svg>
        </motion.span>
        {cartCount > 0 ? (
          <span className="dingry-nav-favoris-badge absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-sm px-1 text-[10px] font-bold tabular-nums leading-none">
            {cartCount}
          </span>
        ) : null}
      </button>
    </>
  );
}

type ShopNavProps = {
  cartCount: number;
  favoriteCount?: number;
  accountActive?: boolean;
  onOpenAccount?: () => void;
  onOpenFavorites?: () => void;
  onOpenCart: () => void;
  onScrollToSection: (id: string) => void;
  /** Ouvre le configurateur tee (bouton doré CUSTOM). */
  onOpenCustom?: () => void;
  /** Aperçu CRM : même chrome, sans `position: fixed` sur la page admin. */
  embedded?: boolean;
  /** `/` ou `/websitedx` — logo renvoie au sommet de la boutique courante. */
  shopBasePath?: ShopBasePath;
};

export function ShopNav({
  cartCount,
  favoriteCount = 0,
  accountActive = false,
  onOpenAccount,
  onOpenFavorites,
  onOpenCart,
  onScrollToSection,
  onOpenCustom,
  embedded = false,
  shopBasePath = "/",
}: ShopNavProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const onHeritagePage = pathname.includes("/heritage");
  const { t } = useTranslation();
  const fly = useFlyAnimationOptional();
  const reduceMotion = useReducedMotion();
  const favorisControls = useAnimation();
  const cartControls = useAnimation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!fly?.pulse || reduceMotion) return;
    const controls = fly.pulse.target === "cart" ? cartControls : favorisControls;
    void controls.start({
      scale: [1, 1.25, 1],
      transition: { duration: 0.35, ease: "easeOut" },
    });
  }, [fly?.pulse, cartControls, favorisControls, reduceMotion]);

  function goSection(id: ShopNavSectionId) {
    if (id === "heritage") {
      if (onHeritagePage) {
        onScrollToSection("heritage-top");
      } else {
        router.push(shopHref(shopBasePath, "/heritage"));
      }
      setMobileMenuOpen(false);
      return;
    }
    if (onHeritagePage) {
      router.push(shopSectionHref(shopBasePath, id));
    } else {
      onScrollToSection(id);
    }
    setMobileMenuOpen(false);
  }

  return (
    <nav
      className={
        embedded
          ? "dingry-shop-nav-bar dingry-gold-rule-bottom relative z-10"
          : "dingry-shop-nav-bar dingry-gold-rule-bottom fixed top-0 left-0 right-0 z-50"
      }
    >
      <svg className="pointer-events-none absolute h-0 w-0" aria-hidden focusable="false">
        <defs>
          <linearGradient id="dingry-gold-gradient-nav" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#bf953f" />
            <stop offset="38%" stopColor="#fcf6ba" />
            <stop offset="50%" stopColor="#fbf5b7" />
            <stop offset="62%" stopColor="#fcf6ba" />
            <stop offset="100%" stopColor="#b38728" />
          </linearGradient>
        </defs>
      </svg>
      <div
        className={`${DINGRY_SHOP_SHELL_CLASS} dingry-nav-shell relative flex items-center justify-between py-2 max-md:pl-0 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center md:py-3`}
      >
        <div className="flex w-full min-w-0 items-center justify-between gap-2 md:contents">
          <div className="flex min-w-0 items-center gap-2 md:gap-4">
            <button
              type="button"
              className="dingry-nav-burger dingry-interactive-luxe relative z-20 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-white/20 bg-white/[0.06] text-white/90 hover:bg-white/[0.1] hover:text-white md:hidden"
              aria-expanded={mobileMenuOpen}
              aria-controls="dingry-nav-mobile-menu"
              aria-label={mobileMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? (
                <X size={20} strokeWidth={1.75} aria-hidden />
              ) : (
                <Menu size={20} strokeWidth={1.75} aria-hidden />
              )}
            </button>
            <DingryLocaleToggle className="shrink-0 md:hidden" variant="pill" />
            <a
              href={shopHref(shopBasePath, "/")}
              className="dingry-nav-logo dingry-nav-logo--mobile-center flex shrink-0 items-center [perspective:900px] max-md:absolute max-md:left-1/2 max-md:top-1/2 max-md:z-10 max-md:-translate-x-1/2 max-md:-translate-y-1/2"
              aria-label="DINGRY Paris"
            >
              <DingryLogo interactive shimmer animate={false} />
            </a>
            <div className="dingry-nav-tagline hidden lg:block" aria-hidden="true">
              <span className="dingry-typo-manifesto">{t("brand.manifesto")}</span>
              <span className="dingry-typo-street dingry-nav-tagline__street">{t("brand.streetLine")}</span>
            </div>
          </div>
          <div className="dingry-nav-menu hidden shrink-0 items-center justify-center gap-3 justify-self-center md:flex lg:gap-5">
            {SECTIONS.map(([id, labelKey]) => (
              <button
                key={id}
                type="button"
                onClick={() => goSection(id)}
                className="dingry-nav-menu-link dingry-interactive-luxe min-h-11 px-1.5 text-xs tracking-[0.26em] text-white/45 uppercase hover:text-white lg:px-2 lg:text-[0.8125rem] lg:tracking-[0.28em]"
              >
                {t(labelKey)}
              </button>
            ))}
            {onOpenCustom ? (
              <button
                type="button"
                onClick={() => onOpenCustom()}
                className={cn(
                  "dingry-catalog-custom-tab dingry-interactive-luxe min-h-11 shrink-0 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] lg:px-5 lg:text-[11px]",
                )}
              >
                <span className="gold-text">{t("nav.custom")}</span>
              </button>
            ) : null}
          </div>
          <div className="relative z-10 ml-auto flex shrink-0 items-center gap-2 justify-self-end md:ml-0 md:gap-3">
            <DingryLocaleToggle className="max-md:hidden" />
            <ShopNavActions
              cartCount={cartCount}
              favoriteCount={favoriteCount}
              accountActive={accountActive}
              onOpenAccount={onOpenAccount}
              onOpenFavorites={onOpenFavorites}
              onOpenCart={onOpenCart}
              favorisControls={favorisControls}
              cartControls={cartControls}
            />
          </div>
        </div>
        {mobileMenuOpen ? (
          <motion.div
            id="dingry-nav-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.mobileNavLabel")}
            initial={reduceMotion ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="dingry-nav-mobile-menu absolute inset-x-0 top-full z-[60] border-t border-white/10 bg-[#12151c]/98 px-4 py-3 shadow-[0_16px_40px_rgb(0_0_0/0.45)] backdrop-blur-md md:hidden"
          >
            {onOpenAccount ? (
              <button
                type="button"
                onClick={() => {
                  onOpenAccount();
                  setMobileMenuOpen(false);
                }}
                className="dingry-interactive-luxe mb-3 flex w-full items-center gap-3 rounded-sm border border-white/15 bg-white/[0.04] px-3 py-3 text-left text-[11px] font-medium tracking-[0.14em] text-white/88 uppercase transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                <CircleUser
                  size={20}
                  strokeWidth={1.75}
                  className={accountActive ? "shrink-0 text-[#fcf6ba]" : "shrink-0 stroke-current"}
                  aria-hidden
                />
                <span>{accountActive ? t("nav.myAccount") : t("nav.signIn")}</span>
              </button>
            ) : null}
            <p className="dingry-typo-manifesto mb-1 text-[10px] text-white/55">{t("brand.manifesto")}</p>
            <ul className="mt-2 flex flex-col gap-0.5">
              <li key="catalogue-street">
                <button
                  type="button"
                  onClick={() => goSection("catalogue")}
                  className="dingry-interactive-luxe w-full py-3 text-left text-xs tracking-[0.25em] text-white/75 uppercase transition-colors hover:text-white"
                >
                  {t("brand.streetLine")}
                </button>
              </li>
              {SECTIONS.filter(([id]) => id !== "catalogue").map(([id, labelKey]) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => goSection(id)}
                    className="dingry-interactive-luxe w-full py-3 text-left text-xs tracking-[0.25em] text-white/75 uppercase transition-colors hover:text-white"
                  >
                    {t(labelKey)}
                  </button>
                </li>
              ))}
              {onOpenCustom ? (
                <li className="mt-2 border-t border-white/10 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCustom();
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "dingry-catalog-custom-tab dingry-interactive-luxe w-full px-4 py-3 text-left text-[10px] font-medium uppercase tracking-[0.26em]",
                    )}
                  >
                    <span className="gold-text">{t("nav.custom")}</span>
                  </button>
                </li>
              ) : null}
            </ul>
          </motion.div>
        ) : null}
      </div>
    </nav>
  );
}
