"use client";

import { useEffect } from "react";
import { Heart } from "lucide-react";
import { motion, useAnimation, useReducedMotion } from "motion/react";
import { useFlyAnimationOptional } from "@/hooks/use-fly-animation";
import { DingryLogo } from "@/components/atoms/dingry-logo";
import { DINGRY_MANIFESTO_FR, DINGRY_STREET_LINE } from "@/lib/dingry-brand-voice";
import { DINGRY_SHOP_SHELL_CLASS } from "@/components/organisms/shop/catalog-layout";
import { shopHref, type ShopBasePath } from "@/lib/shop-base-path";

const SECTIONS = [
  ["catalogue", "Collection"],
  ["atelier-custom", "Atelier"],
  ["heritage", "Héritage"],
  ["lookbook", "Lookbook"],
] as const;

function ShopNavActions({
  cartCount,
  favoriteCount,
  onOpenFavorites,
  onOpenCart,
  favorisControls,
  cartControls,
}: {
  cartCount: number;
  favoriteCount: number;
  onOpenFavorites?: () => void;
  onOpenCart: () => void;
  favorisControls: ReturnType<typeof useAnimation>;
  cartControls: ReturnType<typeof useAnimation>;
}) {
  return (
    <>
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
  onOpenFavorites?: () => void;
  onOpenCart: () => void;
  onScrollToSection: (id: string) => void;
  onOpenHeritage?: () => void;
  /** Aperçu CRM : même chrome, sans `position: fixed` sur la page admin. */
  embedded?: boolean;
  /** `/` ou `/websitedx` — logo renvoie au sommet de la boutique courante. */
  shopBasePath?: ShopBasePath;
};

export function ShopNav({
  cartCount,
  favoriteCount = 0,
  onOpenFavorites,
  onOpenCart,
  onScrollToSection,
  onOpenHeritage,
  embedded = false,
  shopBasePath = "/",
}: ShopNavProps) {
  const fly = useFlyAnimationOptional();
  const reduceMotion = useReducedMotion();
  const favorisControls = useAnimation();
  const cartControls = useAnimation();

  useEffect(() => {
    if (!fly?.pulse || reduceMotion) return;
    const controls = fly.pulse.target === "cart" ? cartControls : favorisControls;
    void controls.start({
      scale: [1, 1.25, 1],
      transition: { duration: 0.35, ease: "easeOut" },
    });
  }, [fly?.pulse, cartControls, favorisControls, reduceMotion]);

  function goSection(id: (typeof SECTIONS)[number][0]) {
    if (id === "heritage") {
      if (onOpenHeritage) {
        onOpenHeritage();
        return;
      }
      onScrollToSection("heritage");
      return;
    }
    onScrollToSection(id);
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
            <div className="dingry-nav-tagline hidden md:block" aria-hidden="true">
              <span className="dingry-typo-manifesto">{DINGRY_MANIFESTO_FR}</span>
              <span className="dingry-typo-street dingry-nav-tagline__street">{DINGRY_STREET_LINE}</span>
            </div>
          </div>
          <div className="hidden items-center justify-center gap-6 md:flex">
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
          </div>
          <div className="relative z-10 flex shrink-0 items-center gap-2 justify-self-end md:gap-3">
            <ShopNavActions
              cartCount={cartCount}
              favoriteCount={favoriteCount}
              onOpenFavorites={onOpenFavorites}
              onOpenCart={onOpenCart}
              favorisControls={favorisControls}
              cartControls={cartControls}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
