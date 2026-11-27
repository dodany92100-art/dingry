"use client";

import type { ProductFlipSide } from "@/components/molecules/product-image-flip";
import type { ShopProduct } from "@/lib/catalog";
import { catalogRectoId } from "@/lib/dingry-product-display";
import { buildCatalogBrandSections, buildCatalogMenuSections } from "@/lib/shop-catalog";
import type { CatalogState } from "./hooks/use-shop-catalog";
import type { AtelierModelPickerGroupId } from "@/lib/atelier-custom-config";
import { CatalogProductCell } from "./catalog-product-cell";
import { AllBrandsFeed } from "./all-brands-feed";
import { CollectionFeed } from "./collection-feed";
import { CATALOG_PRODUCT_GRID_CLASS } from "./catalog-layout";

const GRID_CLASS = CATALOG_PRODUCT_GRID_CLASS;

type CatalogGridProps = {
  catalogState: CatalogState;
  onRetry: () => void;
  /** Clé d'animation : change avec le filtre actif. */
  filterKey: string;
  products: ShopProduct[];
  onOpenProduct: (product: ShopProduct, side: ProductFlipSide) => void;
  wishlistIds: readonly number[];
  onToggleWishlist: (rectoId: number) => void;
  showAdminIdBadge?: boolean;
  atelierEnabled?: boolean;
  onOpenAtelierFromCategory?: (group: AtelierModelPickerGroupId) => void;
};

function EmptyCategory() {
  return (
    <div className="col-span-full border border-white/[0.06] py-20 text-center">
      <p className="dingry-section-eyebrow mb-4">Aucun article ici</p>
      <p className="text-sm tracking-wider text-white/40">
        Aucune pièce en ligne dans cette vue pour le moment · vérifie que la fiche est{' '}
        <span className="text-white/55">mise en ligne</span> avec la bonne catégorie.
      </p>
    </div>
  );
}

export function CatalogGrid({
  catalogState,
  onRetry,
  filterKey,
  products,
  onOpenProduct,
  wishlistIds,
  onToggleWishlist,
  showAdminIdBadge = false,
  atelierEnabled = false,
  onOpenAtelierFromCategory,
}: CatalogGridProps) {
  if (catalogState === "error") {
    return (
      <div className="mb-10 border border-white/15 bg-[#0a0a0a]/80 px-6 py-8 text-center md:px-10">
        <p className="text-sm leading-relaxed text-white/60">
          Impossible de charger Dingry collection pour le moment.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 border border-white/20 px-6 py-3 text-[10px] tracking-[0.22em] text-white uppercase transition-colors hover:border-[#FF3D00] hover:text-[#ff8a4d]"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const isAllBrandsFeed = filterKey === "all-brands";
  const isCollectionFeed = filterKey === "all";
  const brandSections = isAllBrandsFeed ? buildCatalogBrandSections(products) : null;
  const sections = isCollectionFeed ? buildCatalogMenuSections(products) : null;

  if (isAllBrandsFeed && brandSections) {
    return (
      <AllBrandsFeed
        sections={brandSections}
        products={products}
        onOpenProduct={onOpenProduct}
        wishlistIds={wishlistIds}
        onToggleWishlist={onToggleWishlist}
        showAdminIdBadge={showAdminIdBadge}
      />
    );
  }

  if (isCollectionFeed && sections) {
    return sections.length === 0 ? (
      <div className={GRID_CLASS}>
        <EmptyCategory />
      </div>
    ) : (
      <CollectionFeed
        sections={sections}
        products={products}
        onOpenProduct={onOpenProduct}
        wishlistIds={wishlistIds}
        onToggleWishlist={onToggleWishlist}
        showAdminIdBadge={showAdminIdBadge}
        atelierEnabled={atelierEnabled}
        onOpenAtelierFromCategory={onOpenAtelierFromCategory}
      />
    );
  }

  return (
    <div className={GRID_CLASS}>
      {products.length > 0 ? (
        products.map((product, index) => (
          <CatalogProductCell
            key={product.id}
            product={product}
            catalog={products}
            globalIndex={index}
            wishlistActive={wishlistIds.includes(catalogRectoId(product.id))}
            onOpenProduct={onOpenProduct}
            onToggleWishlist={onToggleWishlist}
            showAdminIdBadge={showAdminIdBadge}
          />
        ))
      ) : (
        <EmptyCategory />
      )}
    </div>
  );
}
