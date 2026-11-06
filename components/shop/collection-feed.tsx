"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProductFlipSide } from "@/components/product-image-flip";
import { ProductCard } from "@/components/product-card";
import { isShopProductInStock, type ShopProduct } from "@/lib/catalog";
import { DINGRY_STREET_LINE } from "@/lib/dingry-brand-voice";
import type { CatalogMenuSection } from "@/lib/shop-catalog";
import { storefrontProductSubtitle, storefrontProductTitle } from "@/lib/dingry-product-display";
import { catalogBackImageForRecto, type FlipPair } from "@/lib/shop-view";
import { CatalogCollectionPagination } from "./catalog-collection-pagination";
import { LookbookCatalogStrip } from "./lookbook-catalog-strip";

const COLLECTION_RAIL =
  "flex gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 touch-pan-x snap-x snap-mandatory md:gap-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
const COLLECTION_CARD_SLOT =
  "w-[min(72vw,15.5rem)] shrink-0 snap-start sm:w-[min(42vw,16rem)] md:w-[18rem]";

type CollectionFeedProps = {
  sections: CatalogMenuSection[];
  flipPairs: FlipPair[];
  swipeHintIndex: number;
  onOpenProduct: (product: ShopProduct, side: ProductFlipSide) => void;
};

export function CollectionFeed({
  sections,
  flipPairs,
  swipeHintIndex,
  onOpenProduct,
}: CollectionFeedProps) {
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const totalSections = sections.length;

  useEffect(() => {
    const root = document.querySelector(".dingry-page");
    const nodes = sectionRefs.current.filter((node): node is HTMLDivElement => node !== null);
    if (!root || nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!best) return;
        const index = Number(best.target.getAttribute("data-section-index"));
        if (!Number.isNaN(index)) setActiveSectionIndex(index);
      },
      { root, threshold: [0.2, 0.45, 0.65], rootMargin: "-20% 0px -35% 0px" },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [totalSections]);

  const scrollToSection = useCallback((index: number) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSectionIndex(index);
  }, []);

  const goPrev = () => scrollToSection(Math.max(0, activeSectionIndex - 1));
  const goNext = () => scrollToSection(Math.min(totalSections - 1, activeSectionIndex + 1));

  let indexOffset = 0;

  return (
    <div className="space-y-12 md:space-y-16">
      <div className="border-b border-white/[0.08] pb-4 md:pb-5">
        <p className="text-[10px] font-semibold tracking-[0.35em] text-[#0066FF] uppercase">Collection</p>
        <p className="dingry-typo-street dingry-typo-street--sm mt-1 text-white/85">{DINGRY_STREET_LINE}</p>
      </div>

      {sections.map((section, sectionIndex) => {
        const cells = section.products.map((product, localIndex) => {
          const globalIndex = indexOffset + localIndex;
          return (
            <div key={product.id} className={COLLECTION_CARD_SLOT}>
              <ProductCard
                name={storefrontProductTitle(product)}
                variant={storefrontProductSubtitle(product)}
                image={product.image}
                backImage={catalogBackImageForRecto(product, flipPairs)}
                swipeHint={globalIndex === swipeHintIndex && swipeHintIndex >= 0}
                price={product.price}
                priority={globalIndex < 4}
                soldOut={!isShopProductInStock(product)}
                onClick={(side) => onOpenProduct(product, side)}
              />
            </div>
          );
        });
        indexOffset += section.products.length;

        const isJersey = section.category === "jersey";

        return (
          <div
            key={section.category}
            ref={(node) => {
              sectionRefs.current[sectionIndex] = node;
            }}
            data-section-index={sectionIndex}
            className="scroll-mt-28 space-y-4 md:space-y-5"
          >
            <h3 className="border-b border-white/[0.08] pb-3 text-sm font-medium uppercase tracking-[0.28em] text-white md:pb-4 md:text-base">
              {section.label}
            </h3>
            <div className="relative -mx-1 md:-mx-0">
              <div className={COLLECTION_RAIL} aria-label={`Produits ${section.label}`}>
                {cells}
              </div>
            </div>
            {isJersey ? (
              <>
                <CatalogCollectionPagination
                  className="pt-2 md:pt-3"
                  activeIndex={activeSectionIndex}
                  total={totalSections}
                  onPrev={goPrev}
                  onNext={goNext}
                />
                <LookbookCatalogStrip />
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
