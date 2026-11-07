"use client";

import type { ProductFlipSide } from "@/components/molecules/product-image-flip";
import { ProductCard } from "@/components/molecules/product-card";
import { isShopProductInStock, type ShopProduct } from "@/lib/catalog";
import { DINGRY_STREET_LINE } from "@/lib/dingry-brand-voice";
import type { CatalogMenuSection } from "@/lib/shop-catalog";
import { catalogRectoId } from "@/lib/dingry-product-display";
import { storefrontProductSubtitle, storefrontProductTitle } from "@/lib/dingry-product-display";
import { CATALOG_PRODUCT_GRID_CLASS } from "./catalog-layout";

type CollectionFeedProps = {
  sections: CatalogMenuSection[];
  onOpenProduct: (product: ShopProduct, side: ProductFlipSide) => void;
  wishlistIds: readonly number[];
  onToggleWishlist: (rectoId: number) => void;
};

export function CollectionFeed({
  sections,
  onOpenProduct,
  wishlistIds,
  onToggleWishlist,
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
          const rectoId = catalogRectoId(product.id);
          return (
            <ProductCard
              key={product.id}
              name={storefrontProductTitle(product)}
              variant={storefrontProductSubtitle(product)}
              image={product.image}
              price={product.price}
              priority={globalIndex < 4}
              soldOut={!isShopProductInStock(product)}
              onClick={() => onOpenProduct(product, "recto")}
              wishlistActive={wishlistIds.includes(rectoId)}
              onWishlistToggle={() => onToggleWishlist(rectoId)}
            />
          );
        });
        indexOffset += section.products.length;

        return (
          <div key={section.category} className="scroll-mt-28 space-y-4 md:space-y-5">
            <h3 className="border-b border-white/[0.08] pb-3 text-sm font-medium uppercase tracking-[0.28em] text-white md:pb-4 md:text-base">
              {section.label}
            </h3>
            <div className={CATALOG_PRODUCT_GRID_CLASS} aria-label={`Produits ${section.label}`}>
              {cells}
            </div>
          </div>
        );
      })}
    </div>
  );
}
