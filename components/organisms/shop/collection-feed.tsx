"use client";

import type { ProductFlipSide } from "@/components/molecules/product-image-flip";
import type { ShopProduct } from "@/lib/catalog";
import { DINGRY_STREET_LINE } from "@/lib/dingry-brand-voice";
import type { CatalogMenuSection } from "@/lib/shop-catalog";
import { catalogRectoId } from "@/lib/dingry-product-display";
import { CatalogProductCell } from "./catalog-product-cell";
import { CATALOG_PRODUCT_GRID_CLASS } from "./catalog-layout";

type CollectionFeedProps = {
  sections: CatalogMenuSection[];
  products: readonly ShopProduct[];
  onOpenProduct: (product: ShopProduct, side: ProductFlipSide) => void;
  wishlistIds: readonly number[];
  onToggleWishlist: (rectoId: number) => void;
};

export function CollectionFeed({
  sections,
  products,
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
            <CatalogProductCell
              key={product.id}
              product={product}
              catalog={products}
              globalIndex={globalIndex}
              wishlistActive={wishlistIds.includes(rectoId)}
              onOpenProduct={onOpenProduct}
              onToggleWishlist={onToggleWishlist}
            />
          );
        });
        indexOffset += section.products.length;

        return (
          <div key={section.category} className="scroll-mt-28 space-y-4 md:space-y-5">
            <h3 className="border-b border-white/[0.08] pb-3 text-sm font-medium uppercase tracking-[0.28em] text-white md:pb-4 md:text-base">
              {section.label}
            </h3>
            {section.products.length === 0 ? (
              <p className="text-sm tracking-wider text-white/40">
                Aucune pièce en ligne pour le moment · vérifie la catégorie{' '}
                <span className="text-white/55">{section.label}</span> sur les fiches CRM.
              </p>
            ) : (
              <div className={CATALOG_PRODUCT_GRID_CLASS} aria-label={`Produits ${section.label}`}>
                {cells}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
