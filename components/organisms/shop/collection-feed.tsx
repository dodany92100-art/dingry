"use client";

import type { ProductFlipSide } from "@/components/molecules/product-image-flip";
import { ProductCard } from "@/components/molecules/product-card";
import { isShopProductInStock, type ShopProduct } from "@/lib/catalog";
import { DINGRY_STREET_LINE } from "@/lib/dingry-brand-voice";
import type { CatalogMenuSection } from "@/lib/shop-catalog";
import { storefrontProductSubtitle, storefrontProductTitle } from "@/lib/dingry-product-display";
import { catalogBackImageForRecto, type FlipPair } from "@/lib/shop-view";

const COLLECTION_RAIL =
  "flex gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 touch-pan-x snap-x snap-mandatory md:gap-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

const COLLECTION_CARD_SLOT =
  "w-[min(72vw,15.5rem)] shrink-0 snap-start sm:w-[min(42vw,16rem)] md:w-[18rem]";

type CollectionFeedProps = {
  sections: CatalogMenuSection[];
  flipPairs: FlipPair[];
  onOpenProduct: (product: ShopProduct, side: ProductFlipSide) => void;
};

export function CollectionFeed({
  sections,
  flipPairs,
  onOpenProduct,
}: CollectionFeedProps) {
  let indexOffset = 0;

  return (
    <div className="space-y-12 md:space-y-16">
      <div className="border-b border-white/[0.08] pb-4 md:pb-5">
        <p className="text-[10px] font-semibold tracking-[0.35em] text-[#0066FF] uppercase">Collection</p>
        <p className="dingry-typo-street dingry-typo-street--sm mt-1 text-white/85">{DINGRY_STREET_LINE}</p>
      </div>

      {sections.map((section) => {
        const cells = section.products.map((product, localIndex) => {
          const globalIndex = indexOffset + localIndex;
          return (
            <div key={product.id} className={COLLECTION_CARD_SLOT}>
              <ProductCard
                name={storefrontProductTitle(product)}
                variant={storefrontProductSubtitle(product)}
                image={product.image}
                backImage={catalogBackImageForRecto(product, flipPairs)}
                isFirstInGrid={globalIndex === 0}
                price={product.price}
                priority={globalIndex < 4}
                soldOut={!isShopProductInStock(product)}
                onClick={(side) => onOpenProduct(product, side)}
              />
            </div>
          );
        });
        indexOffset += section.products.length;

        return (
          <div key={section.category} className="scroll-mt-28 space-y-4 md:space-y-5">
            <h3 className="border-b border-white/[0.08] pb-3 text-sm font-medium uppercase tracking-[0.28em] text-white md:pb-4 md:text-base">
              {section.label}
            </h3>
            <div className="relative -mx-1 md:-mx-0">
              <div className={COLLECTION_RAIL} aria-label={`Produits ${section.label}`}>
                {cells}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
