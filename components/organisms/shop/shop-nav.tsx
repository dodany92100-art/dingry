"use client";

import { useEffect, useState } from "react";
import { CircleUser, Heart, Menu, X } from "lucide-react";
import { motion, useAnimation, useReducedMotion } from "motion/react";
import { useFlyAnimationOptional } from "@/hooks/use-fly-animation";
import { DingryLogo } from "@/components/atoms/dingry-logo";
import { DINGRY_MANIFESTO_FR, DINGRY_STREET_LINE } from "@/lib/dingry-brand-voice";
import { DINGRY_SHOP_SHELL_CLASS } from "@/components/organisms/shop/catalog-layout";
import { shopHref, type ShopBasePath } from "@/lib/shop-base-path";
import { CATALOG_MENU_TAB_CUSTOM, catalogMenuTabLabel } from "@/lib/shop-catalog";
import { cn } from "@/lib/utils";

const SECTIONS = [
  ["catalogue", "Collection"],
  ["atelier-custom", "Atelier"],
  ["heritage", "Héritage"],
  ["lookbook", "Lookbook"],
] as const;

type ShopNavSectionId = (typeof SECTIONS)[number][0];

const MOBILE_MENU_ITEMS: { id: ShopNavSectionId; label: string }[] = [
  { id: "catalogue", label: DINGRY_STREET_LINE },
  ...SECTIONS.map(([id, label]) => ({ id, label })),
];

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
  return (
    <>
      {onOpenAccount ? (
        <button
          type="button"
          onClick={onOpenAccount}
          aria-label={accountActive ? "Compte connecté" : "Se connecter"}
          className="dingry-interactive-luxe flex h-11 w-11 items-center justify-center rounded-sm border border-white/20 bg-white/[0.06] text-white/75 hover:bg-white/[0.1] hover:text-white"
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
              ? `Favoris, ${favoriteCount} article${favoriteCount > 1 ? "s" : ""}`
              : "Voir le catalogue — favoris"
          }
          className="dingry-nav-favoris-btn dingry-interactive-luxe relative flex h-11 w-11 items-center justify-center rounded-sm border border-white/20 bg-white/[0.06] text-white/75 hover:bg-white/[0.1] hover:text-white"
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
        aria-label={cartCount > 0 ? `Panier, ${cartCount} article${cartCount > 1 ? "s" : ""}` : "Ouvrir le panier"}
        className="dingry-interactive-luxe dingry-nav-cart-btn relative flex h-11 w-11 items-center justify-center gap-0 rounded-sm border border-white/20 bg-white/[0.06] text-white/90 hover:bg-white/[0.1] hover:text-white md:w-auto md:justify-start md:gap-2.5 md:px-4"
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
        <span className="hidden text-[10px] font-medium tracking-[0.22em] uppercase md:inline">Panier</span>
        {cartCount > 0 ? (
          <span className="dingry-nav-favoris-badge absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-sm px-1 text-[10px] font-bold tabular-nums leading-none md:static md:px-1.5">
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
  onOpenHeritage?: () => void;
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
  onOpenHeritage,
  onOpenCustom,
  embedded = false,
  shopBasePath = "/",
}: ShopNavProps) {
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
      if (onOpenHeritage) {
        onOpenHeritage();
      } else {
        onScrollToSection("heritage");
      }
      setMobileMenuOpen(false);
      return;
    }
    onScrollToSection(id);
    setMobileMenuOpen(false);
  }

  return (
    <nav
      className={
        embedded
          ? "dingry-gold-rule-bottom relative z-10 bg-[#12151c]/95 backdrop-blur-md"
          : "dingry-gold-rule-bottom fixed top-0 left-0 right-0 z-50 bg-[#12151c]/95 backdrop-blur-md"
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
        className={`${DINGRY_SHOP_SHELL_CLASS} relative flex items-center justify-between py-2.5 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:py-5`}
      >
        <div className="flex min-w-0 items-center justify-between gap-2 md:contents">
          <div className="flex min-w-0 items-center gap-4 md:gap-6">
            <a
              href={shopHref(shopBasePath, "/")}
              className="dingry-nav-logo flex shrink-0 items-center [perspective:900px]"
              aria-label="DINGRY Paris"
            >
              <DingryLogo interactive shimmer animate={false} />
            </a>
            <button
              type="button"
              className="dingry-nav-burger dingry-interactive-luxe flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-white/20 bg-white/[0.06] text-white/90 hover:bg-white/[0.1] hover:text-white md:hidden"
              aria-expanded={mobileMenuOpen}
              aria-controls="dingry-nav-mobile-menu"
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? (
                <X size={20} strokeWidth={1.75} aria-hidden />
              ) : (
                <Menu size={20} strokeWidth={1.75} aria-hidden />
              )}
            </button>
            <div className="dingry-nav-tagline hidden md:block" aria-hidden="true">
              <span className="dingry-typo-manifesto">{DINGRY_MANIFESTO_FR}</span>
              <span className="dingry-typo-street dingry-nav-tagline__street">{DINGRY_STREET_LINE}</span>
            </div>
          </div>
          <div className="hidden items-center justify-center gap-4 md:flex lg:gap-6">
            {SECTIONS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => goSection(id)}
                className="dingry-interactive-luxe min-h-11 px-1 text-xs tracking-[0.25em] text-white/40 uppercase hover:text-white"
              >
                {label}
              </button>
            ))}
            {onOpenCustom ? (
              <button
                type="button"
                onClick={() => onOpenCustom()}
                className={cn(
                  "dingry-catalog-custom-tab dingry-interactive-luxe min-h-11 shrink-0 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.26em] sm:px-5 sm:text-[11px] sm:tracking-[0.28em]",
                )}
              >
                <span className="gold-text">{catalogMenuTabLabel(CATALOG_MENU_TAB_CUSTOM)}</span>
              </button>
            ) : null}
          </div>
          <div className="relative z-10 flex shrink-0 items-center gap-2 justify-self-end md:gap-3">
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
            aria-label="Navigation boutique"
            initial={reduceMotion ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="dingry-nav-mobile-menu absolute inset-x-0 top-full z-50 border-t border-white/10 bg-[#12151c]/98 px-4 py-3 shadow-[0_16px_40px_rgb(0_0_0/0.45)] backdrop-blur-md md:hidden"
          >
            <p className="dingry-typo-manifesto mb-1 text-[10px] text-white/55">{DINGRY_MANIFESTO_FR}</p>
            <ul className="mt-2 flex flex-col gap-0.5">
              {MOBILE_MENU_ITEMS.map(({ id, label }) => (
                <li key={`${id}-${label}`}>
                  <button
                    type="button"
                    onClick={() => goSection(id)}
                    className="dingry-interactive-luxe w-full py-3 text-left text-xs tracking-[0.25em] text-white/75 uppercase transition-colors hover:text-white"
                  >
                    {label}
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
                    <span className="gold-text">{catalogMenuTabLabel(CATALOG_MENU_TAB_CUSTOM)}</span>
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
