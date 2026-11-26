"use client";

import type { ProductFlipSide } from "@/components/molecules/product-image-flip";
import type { ShopProduct } from "@/lib/catalog";
import { useTranslation } from "@/hooks/use-translation";
import { useShopStorefrontCopy } from "@/hooks/shop-storefront-copy-context";
import { AdminStorefrontCopyTrigger } from "@/components/molecules/shop/admin-storefront-copy-panel";
import type { CatalogMenuSection } from "@/lib/shop-catalog";
import {
  catalogCategoryToAtelierModelGroup,
  isAtelierCatalogCustomSection,
  type AtelierModelPickerGroupId,
} from "@/lib/atelier-custom-config";
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
  atelierEnabled?: boolean;
  onOpenAtelierFromCategory?: (group: AtelierModelPickerGroupId) => void;
};

export function CollectionFeed({
  sections,
  products,
  onOpenProduct,
  wishlistIds,
  onToggleWishlist,
  showAdminIdBadge = false,
  atelierEnabled = false,
  onOpenAtelierFromCategory,
}: CollectionFeedProps) {
  const { t } = useTranslation();
  const { categorySectionLabel } = useShopStorefrontCopy();
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
        const sectionTitle = categorySectionLabel(section.category, section.label);

        return (
          <div key={section.category} className="space-y-4 md:space-y-5">
            {section.category === "hoodies" ? (
              <div className="pb-4 md:pb-5">
                <p className="dingry-section-eyebrow dingry-catalog-collection-eyebrow">{t("collection.eyebrow")}</p>
              </div>
            ) : null}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-end gap-2">
                <h3 id={`catalog-section-${section.category}`} className={`${CATALOG_SECTION_HEADING_CLASS} min-w-0 flex-1`}>
                  {sectionTitle}
                </h3>
                {showAdminIdBadge ? (
                  <AdminStorefrontCopyTrigger
                    mode="catalog"
                    className="mb-2 md:mb-3"
                    ariaLabel={`Modifier le titre ${sectionTitle}`}
                  />
                ) : null}
              </div>
              {atelierEnabled && onOpenAtelierFromCategory && isAtelierCatalogCustomSection(section.category) ? (
                <button
                  type="button"
                  onClick={() => {
                    const group = catalogCategoryToAtelierModelGroup(section.category);
                    if (group) onOpenAtelierFromCategory(group);
                  }}
                  className="dingry-gold-pill-btn mb-3 shrink-0 rounded-full px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] md:mb-4 md:px-8 md:py-3 md:text-[11px]"
                >
                  <span className="gold-text">{t("collection.customCta")}</span>
                </button>
              ) : null}
            </div>
            {section.products.length === 0 ? (
              <p className="text-sm tracking-wider text-white/40">
                {t("collection.emptyCategory")}{" "}
                <span className="text-white/55">{sectionTitle}</span> {t("collection.emptyCategoryEnd")}
              </p>
            ) : (
              <div className={CATALOG_PRODUCT_GRID_CLASS} aria-label={t("collection.productsAria", { label: sectionTitle })}>
                {cells}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
