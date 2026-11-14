"use client";

import type { ProductFlipSide } from "@/components/molecules/product-image-flip";
import type { ShopProduct } from "@/lib/catalog";
import { useTranslation } from "@/hooks/use-translation";
import type { CatalogMenuSection } from "@/lib/shop-catalog";
import { catalogRectoId } from "@/lib/dingry-product-display";
import { CatalogProductCell } from "./catalog-product-cell";
import { CATALOG_PRODUCT_GRID_CLASS, CATALOG_SECTION_HEADING_CLASS } from "./catalog-layout";

type CollectionFeedProps = {
  sections: CatalogMenuSection[];
  products: readonly ShopProduct[];
  onOpenProduct: (product: ShopProduct, side: ProductFlipSide) => void;
  wishlistIds: readonly number[];
  onToggleWishlist: (rectoId: number) => void;
  showAdminIdBadge?: boolean;
};

export function CollectionFeed({
  sections,
  products,
  onOpenProduct,
  wishlistIds,
  onToggleWishlist,
  showAdminIdBadge = false,
}: CollectionFeedProps) {
  const { t } = useTranslation();
  let indexOffset = 0;

  return (
    <div className="space-y-12 md:space-y-16">
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
              showAdminIdBadge={showAdminIdBadge}
            />
          );
        });
        indexOffset += section.products.length;

        return (
          <div key={section.category} className="space-y-4 md:space-y-5">
            {section.category === "hoodies" ? (
              <div className="pb-4 md:pb-5">
                <p className="dingry-section-eyebrow">{t("collection.eyebrow")}</p>
                <p className="dingry-typo-street dingry-typo-street--sm mt-1 text-white/85">{t("footer.streetLine")}</p>
              </div>
            ) : null}
            <h3 id={`catalog-section-${section.category}`} className={CATALOG_SECTION_HEADING_CLASS}>
              {section.label}
            </h3>
            {section.products.length === 0 ? (
              <p className="text-sm tracking-wider text-white/40">
                {t("collection.emptyCategory")}{" "}
                <span className="text-white/55">{section.label}</span> {t("collection.emptyCategoryEnd")}
              </p>
            ) : (
              <div className={CATALOG_PRODUCT_GRID_CLASS} aria-label={t("collection.productsAria", { label: section.label })}>
                {cells}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
