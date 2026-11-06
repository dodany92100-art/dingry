"use client";

import { useMemo } from "react";
import { ProductCard } from "@/components/molecules/product-card";
import { isShopProductInStock, type ShopProduct } from "@/lib/catalog";
import { adminProductsToShopPreview } from "@/lib/admin/admin-shop-preview";
import type { AdminProduct } from "@/lib/admin/types";
import { normalizeProductCategory } from "@/lib/admin/types";
import { storefrontProductSubtitle, storefrontProductTitle } from "@/lib/dingry-product-display";
import { DINGRY_STREET_LINE } from "@/lib/dingry-brand-voice";
import { buildCatalogMenuSections, parseCatalogFilter } from "@/lib/shop-catalog";
import { catalogBackImageForRecto, buildFlipPairs } from "@/lib/shop-view";
import {
  ADMIN_STOREFRONT_PREVIEW_BLEED_CLASS,
  CATALOG_PRODUCT_GRID_CLASS,
  CATALOG_SECTION_HEADING_CLASS,
  CATALOG_SECTION_SURFACE_CLASS,
} from "@/components/organisms/shop/catalog-layout";
import { CatalogFilterBar, type CatalogTabValue } from "@/components/organisms/shop/catalog-filter-bar";
import { ShopNav } from "@/components/organisms/shop/shop-nav";
import type { AdminProductCategoryFilter } from "@/lib/shop-data";

type AdminStockStorefrontPreviewProps = {
  products: AdminProduct[];
  categoryFilter: AdminProductCategoryFilter;
};

function adminCategoryToCatalogTab(filter: AdminProductCategoryFilter): CatalogTabValue {
  if (filter === "Collection") return "all";
  return parseCatalogFilter(filter);
}

function filterPreviewAdminProducts(
  products: AdminProduct[],
  categoryFilter: AdminProductCategoryFilter,
): AdminProduct[] {
  if (categoryFilter === "Collection") return products;
  return products.filter(
    (product) => normalizeProductCategory(product.category) === categoryFilter,
  );
}

function PreviewProductCard({
  product,
  flipPairs,
  globalIndex,
}: {
  product: ShopProduct;
  flipPairs: ReturnType<typeof buildFlipPairs>;
  globalIndex: number;
}) {
  return (
    <ProductCard
      name={storefrontProductTitle(product)}
      variant={storefrontProductSubtitle(product)}
      image={product.image}
      backImage={catalogBackImageForRecto(product, flipPairs)}
      isFirstInGrid={globalIndex === 0}
      price={product.price}
      priority={globalIndex < 4}
      soldOut={!isShopProductInStock(product)}
    />
  );
}

function PreviewGrid({
  shopProducts,
  flipPairs,
}: {
  shopProducts: ShopProduct[];
  flipPairs: ReturnType<typeof buildFlipPairs>;
}) {
  return (
    <div className={CATALOG_PRODUCT_GRID_CLASS}>
      {shopProducts.map((product, index) => (
        <PreviewProductCard key={product.id} product={product} flipPairs={flipPairs} globalIndex={index} />
      ))}
    </div>
  );
}

function PreviewCatalogBody({
  shopProducts,
  flipPairs,
  sections,
}: {
  shopProducts: ShopProduct[];
  flipPairs: ReturnType<typeof buildFlipPairs>;
  sections: ReturnType<typeof buildCatalogMenuSections> | null;
}) {
  if (shopProducts.length === 0) {
    return (
      <div className={CATALOG_PRODUCT_GRID_CLASS}>
        <div className="col-span-full border border-white/[0.06] py-20 text-center">
          <p className="text-sm tracking-wider text-white/40">Rien à prévisualiser dans cette catégorie.</p>
        </div>
      </div>
    );
  }

  if (sections && sections.length > 0) {
    let indexOffset = 0;
    return (
      <div className="space-y-12 md:space-y-16">
        <div className="border-b border-white/[0.08] pb-4 md:pb-5">
          <p className="text-[10px] font-semibold tracking-[0.35em] text-[#0066FF] uppercase">Collection</p>
          <p className="dingry-typo-street dingry-typo-street--sm mt-1 text-white/85">{DINGRY_STREET_LINE}</p>
        </div>
        {sections.map((section) => {
          const sectionCells = section.products.map((product, localIndex) => {
            const globalIndex = indexOffset + localIndex;
            return (
              <PreviewProductCard
                key={product.id}
                product={product}
                flipPairs={flipPairs}
                globalIndex={globalIndex}
              />
            );
          });
          indexOffset += section.products.length;
          return (
            <section key={section.category} className="space-y-4 md:space-y-5">
              <h3 className={CATALOG_SECTION_HEADING_CLASS}>{section.label}</h3>
              <div className={CATALOG_PRODUCT_GRID_CLASS}>{sectionCells}</div>
            </section>
          );
        })}
      </div>
    );
  }

  return <PreviewGrid shopProducts={shopProducts} flipPairs={flipPairs} />;
}

export function AdminStockStorefrontPreview({
  products,
  categoryFilter,
}: AdminStockStorefrontPreviewProps) {
  const catalogTab = adminCategoryToCatalogTab(categoryFilter);

  const shopProducts = useMemo(() => {
    const scoped = filterPreviewAdminProducts(products, categoryFilter);
    return adminProductsToShopPreview(scoped);
  }, [products, categoryFilter]);

  const sections = useMemo(
    () => (categoryFilter === "Collection" ? buildCatalogMenuSections(shopProducts) : null),
    [categoryFilter, shopProducts],
  );

  const flipPairs = useMemo(() => buildFlipPairs(shopProducts), [shopProducts]);

  return (
    <div className={`dingry-shop text-white ${ADMIN_STOREFRONT_PREVIEW_BLEED_CLASS}`}>
      <ShopNav embedded cartCount={0} onOpenCart={() => {}} onScrollToSection={() => {}} />
      <section className={`${CATALOG_SECTION_SURFACE_CLASS} pt-4 md:pt-6`}>
        <p className="mb-5 text-[10px] uppercase tracking-[0.22em] text-white/35">
          Aperçu boutique · brouillons inclus · ordre CRM actuel
        </p>
        <div className="pointer-events-none select-none" aria-hidden>
          <CatalogFilterBar value={catalogTab} onChange={() => {}} />
        </div>
        <PreviewCatalogBody shopProducts={shopProducts} flipPairs={flipPairs} sections={sections} />
      </section>
    </div>
  );
}
