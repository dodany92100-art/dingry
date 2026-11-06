"use client";

import { DingryLogo } from "@/components/dingry-logo";
import { DINGRY_MANIFESTO_EN, DINGRY_STREET_LINE } from "@/lib/dingry-brand-voice";

const SECTIONS = [
  ["catalogue", "Catalogue"],
  ["lookbook", "Lookbook"],
  ["heritage", "Heritage"],
] as const;

type ShopNavProps = {
  cartCount: number;
  onOpenCart: () => void;
  onScrollToSection: (id: string) => void;
};

export function ShopNav({ cartCount, onOpenCart, onScrollToSection }: ShopNavProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-[#12151c]/95 backdrop-blur-md">
      <div className="relative flex items-center justify-between px-4 py-2.5 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:px-12 md:py-5">
        <div className="flex min-w-0 items-center gap-4 md:gap-6">
          <a href="/" className="flex shrink-0 items-center [perspective:900px]" aria-label="DINGRY Paris">
            <DingryLogo animate />
          </a>
          <div className="dingry-nav-tagline hidden text-left md:block">
            <span className="dingry-typo-manifesto-en block text-[9px] leading-snug tracking-[0.2em]">
              {DINGRY_MANIFESTO_EN}
            </span>
            <span className="dingry-typo-street mt-1 block text-lg leading-none">{DINGRY_STREET_LINE}</span>
          </div>
        </div>
        <div className="hidden items-center justify-center gap-6 md:flex">
          {SECTIONS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onScrollToSection(id)}
              className="dingry-interactive-luxe text-xs tracking-[0.25em] text-white/40 uppercase hover:text-white"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative z-10 flex shrink-0 items-center justify-self-end md:justify-self-end">
          <button
            type="button"
            onClick={onOpenCart}
            aria-label={cartCount > 0 ? `Panier, ${cartCount} article${cartCount > 1 ? "s" : ""}` : "Ouvrir le panier"}
            className="dingry-interactive-luxe relative flex h-11 items-center gap-2.5 rounded-sm border border-white/20 bg-white/[0.06] px-3.5 text-white/90 hover:border-[#0066FF]/50 hover:bg-white/[0.1] hover:text-white md:px-4"
          >
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
            <span className="text-[10px] font-medium tracking-[0.22em] uppercase">Panier</span>
            {cartCount > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center bg-[#0066FF] px-1.5 text-[10px] font-bold leading-none text-white">
                {cartCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </nav>
  );
}
