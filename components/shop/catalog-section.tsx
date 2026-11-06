"use client";

import type { ProductFlipSide } from "@/components/product-image-flip";
import { DingryLogo } from "@/components/dingry-logo";
import type { ShopProduct } from "@/lib/catalog";
import { DINGRY_MANIFESTO_FR, DINGRY_STREET_LINE } from "@/lib/dingry-brand-voice";
import type { FlipPair } from "@/lib/shop-view";
import { CatalogFilterBar, type CatalogTabValue } from "./catalog-filter-bar";
import { CatalogGrid } from "./catalog-grid";
import type { CatalogState } from "./hooks/use-shop-catalog";

type CatalogSectionProps = {
  tabValue: CatalogTabValue;
  onTabChange: (tab: string) => void;
  onOpenCustom: () => void;
  catalogState: CatalogState;
  onRetry: () => void;
  filterKey: string;
  products: ShopProduct[];
  flipPairs: FlipPair[];
  swipeHintIndex: number;
  onOpenProduct: (product: ShopProduct, side: ProductFlipSide) => void;
};

export function CatalogSection({
  tabValue,
  onTabChange,
  onOpenCustom,
  ...grid
}: CatalogSectionProps) {
  return (
    <section id="catalogue" className="dingry-catalog-surface px-4 pb-20 md:px-12 md:pb-24">
      <div className="mb-4 md:mb-5">
        <h2 className="mb-2">
          <DingryLogo animate={false} className="dingry-catalog-logo h-9 md:h-14" />
        </h2>
        <p className="dingry-typo-manifesto text-[10px] sm:text-[11px]">{DINGRY_MANIFESTO_FR}</p>
        <p className="dingry-typo-street dingry-typo-street--sm mt-2 text-white/85">{DINGRY_STREET_LINE}</p>
      </div>

      <CatalogFilterBar value={tabValue} onChange={onTabChange} />

      <button
        type="button"
        onClick={onOpenCustom}
        className="group mb-8 w-full border border-[#0066FF]/40 bg-gradient-to-r from-[#0066FF]/15 via-[#0066FF]/8 to-transparent p-5 text-left transition-colors hover:border-[#0066FF]/65 hover:from-[#0066FF]/22 md:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-[10px] font-semibold tracking-[0.32em] text-[#0066FF] uppercase">
              Custom · Configurateur
            </p>
            <p className="mt-2 text-lg uppercase tracking-tight text-white md:text-xl">
              Ville, texte ou message sous le logo
            </p>
            <p className="mt-2 text-sm text-white/50">Tee personnalisable · aperçu en direct</p>
          </div>
          <span className="shrink-0 bg-[#0066FF] px-5 py-3 text-[10px] font-medium tracking-[0.24em] text-white uppercase transition-colors group-hover:bg-[#0052cc]">
            Ouvrir
          </span>
        </div>
      </button>

      <CatalogGrid {...grid} />
    </section>
  );
}
