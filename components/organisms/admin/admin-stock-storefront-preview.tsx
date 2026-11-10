"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/molecules/product-card";
import { isShopProductInStock } from "@/lib/catalog";
import type { StorefrontOnlineProduct } from "@/lib/admin/storefront-online-catalog";
import { storefrontProductSubtitle, storefrontProductTitle } from "@/lib/dingry-product-display";
import { cn } from "@/lib/utils";
import { DINGRY_STREET_LINE } from "@/lib/dingry-brand-voice";
import {
  buildCatalogMenuSections,
  filterByCategory,
  parseCatalogFilter,
} from "@/lib/shop-catalog";
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
  categoryFilter: AdminProductCategoryFilter;
  onUnauthorized?: () => void;
};

function adminCategoryToCatalogTab(filter: AdminProductCategoryFilter): CatalogTabValue {
  if (filter === "Collection") return "all";
  return parseCatalogFilter(filter);
}

function filterOnlineByAdminCategory(
  products: StorefrontOnlineProduct[],
  categoryFilter: AdminProductCategoryFilter,
): StorefrontOnlineProduct[] {
  if (categoryFilter === "Collection") return products;
  const tab = parseCatalogFilter(categoryFilter);
  return filterByCategory(products, tab);
}

function PreviewProductCard({
  product,
  globalIndex,
  masking,
  onMask,
}: {
  product: StorefrontOnlineProduct;
  globalIndex: number;
  masking: boolean;
  onMask?: (productId: number) => void;
}) {
  return (
    <div className="relative h-full min-h-0">
      {product.ghost ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-2">
          <span className="pointer-events-auto bg-orange-500/90 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-black">
            Hors CRM
          </span>
          {onMask ? (
            <button
              type="button"
              disabled={masking}
              onClick={() => onMask(product.id)}
              className="pointer-events-auto border border-white/25 bg-black/80 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-white transition hover:border-white/50 disabled:opacity-50"
            >
              {masking ? "…" : "Masquer"}
            </button>
          ) : null}
        </div>
      ) : null}
      <ProductCard
        productId={product.id}
        name={storefrontProductTitle(product)}
        variant={storefrontProductSubtitle(product)}
        image={product.image}
        price={product.price}
        priority={globalIndex < 4}
        soldOut={!isShopProductInStock(product)}
        className={cn("h-full", product.ghost ? "ring-1 ring-orange-400/50" : undefined)}
      />
    </div>
  );
}

function PreviewGrid({
  shopProducts,
  maskingId,
  onMask,
}: {
  shopProducts: StorefrontOnlineProduct[];
  maskingId: number | null;
  onMask?: (productId: number) => void;
}) {
  return (
    <div className={CATALOG_PRODUCT_GRID_CLASS}>
      {shopProducts.map((product, index) => (
        <PreviewProductCard
          key={product.id}
          product={product}
          globalIndex={index}
          masking={maskingId === product.id}
          onMask={product.ghost ? onMask : undefined}
        />
      ))}
    </div>
  );
}

function PreviewCatalogBody({
  shopProducts,
  sections,
  maskingId,
  onMask,
}: {
  shopProducts: StorefrontOnlineProduct[];
  sections: ReturnType<typeof buildCatalogMenuSections> | null;
  maskingId: number | null;
  onMask?: (productId: number) => void;
}) {
  if (shopProducts.length === 0) {
    return (
      <div className={CATALOG_PRODUCT_GRID_CLASS}>
        <div className="col-span-full border border-white/[0.06] py-20 text-center">
          <p className="text-sm tracking-wider text-white/40">Rien à afficher dans cette catégorie.</p>
        </div>
      </div>
    );
  }

  if (sections && sections.length > 0) {
    let indexOffset = 0;
    return (
      <div className="space-y-12 md:space-y-16">
        <div className="border-b border-white/[0.08] pb-4 md:pb-5">
          <p className="dingry-section-eyebrow">Collection</p>
          <p className="dingry-typo-street dingry-typo-street--sm mt-1 text-white/85">{DINGRY_STREET_LINE}</p>
        </div>
        {sections.map((section) => {
          const sectionCells = section.products.map((product, localIndex) => {
            const globalIndex = indexOffset + localIndex;
            const online = shopProducts.find((item) => item.id === product.id);
            if (!online) return null;
            return (
              <PreviewProductCard
                key={product.id}
                product={online}
                globalIndex={globalIndex}
                masking={maskingId === product.id}
                onMask={online.ghost ? onMask : undefined}
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

  return (
    <PreviewGrid shopProducts={shopProducts} maskingId={maskingId} onMask={onMask} />
  );
}

export function AdminStockStorefrontPreview({
  categoryFilter,
  onUnauthorized,
}: AdminStockStorefrontPreviewProps) {
  const catalogTab = adminCategoryToCatalogTab(categoryFilter);
  const [onlineProducts, setOnlineProducts] = useState<StorefrontOnlineProduct[]>([]);
  const [ghostCount, setGhostCount] = useState(0);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState("");
  const [maskingId, setMaskingId] = useState<number | null>(null);

  const reload = useCallback(async () => {
    setLoadState((state) => (state === "ready" ? state : "loading"));
    setLoadError("");
    try {
      const response = await fetch("/api/admin/storefront-catalog", { cache: "no-store" });
      if (response.status === 401) {
        onUnauthorized?.();
        return;
      }
      if (!response.ok) {
        setLoadState("error");
        setLoadError("Catalogue en ligne indisponible.");
        return;
      }
      const data = (await response.json()) as {
        products?: StorefrontOnlineProduct[];
        ghostCount?: number;
      };
      const products = Array.isArray(data.products) ? data.products : [];
      setOnlineProducts(products);
      setGhostCount(typeof data.ghostCount === "number" ? data.ghostCount : products.filter((p) => p.ghost).length);
      setLoadState("ready");
    } catch {
      setLoadState("error");
      setLoadError("Catalogue en ligne indisponible.");
    }
  }, [onUnauthorized]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleMask = useCallback(
    async (productId: number) => {
      const label = storefrontProductTitle(
        onlineProducts.find((p) => p.id === productId) ?? {
          id: productId,
          name: `#${productId}`,
          variant: "",
          category: "",
          price: 0,
          image: "",
          sizes: [],
          description: "",
        },
      );
      if (!window.confirm(`Masquer « ${label} » du site public ? (tombstone, sans effacer le code)`)) {
        return;
      }
      setMaskingId(productId);
      try {
        const response = await fetch("/api/admin/catalog-mask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: String(productId) }),
        });
        if (response.status === 401) {
          onUnauthorized?.();
          return;
        }
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          window.alert(payload.error ?? "Masquage impossible.");
          return;
        }
        await reload();
      } finally {
        setMaskingId(null);
      }
    },
    [onlineProducts, onUnauthorized, reload],
  );

  const scopedProducts = useMemo(
    () => filterOnlineByAdminCategory(onlineProducts, categoryFilter),
    [onlineProducts, categoryFilter],
  );

  const sections = useMemo(
    () => (categoryFilter === "Collection" ? buildCatalogMenuSections(scopedProducts) : null),
    [categoryFilter, scopedProducts],
  );

  const scopedGhostCount = scopedProducts.filter((product) => product.ghost).length;

  return (
    <div className={`dingry-shop text-white ${ADMIN_STOREFRONT_PREVIEW_BLEED_CLASS}`}>
      <ShopNav embedded cartCount={0} onOpenCart={() => {}} onScrollToSection={() => {}} />
      <section className={`${CATALOG_SECTION_SURFACE_CLASS} pt-4 md:pt-6`}>
        <div className="mb-5 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">
            Catalogue en ligne (réel) · même fusion que la boutique publique
          </p>
          <p className="max-w-2xl text-[10px] leading-relaxed tracking-[0.08em] text-white/30">
            Badge « Hors CRM » = visible sur le site via le catalogue de secours, sans fiche modifiable.
            « Masquer » ajoute un tombstone (id par id). Ne pas tout masquer d&apos;un coup sans tri.
          </p>
          {loadState === "ready" ? (
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">
              {scopedProducts.length} carte{scopedProducts.length > 1 ? "s" : ""}
              {categoryFilter === "Collection" ? ` · ${ghostCount} fantôme${ghostCount > 1 ? "s" : ""} au total` : null}
              {categoryFilter !== "Collection" && scopedGhostCount > 0
                ? ` · ${scopedGhostCount} fantôme${scopedGhostCount > 1 ? "s" : ""}`
                : null}
            </p>
          ) : null}
        </div>
        <div className="pointer-events-none select-none" aria-hidden>
          <CatalogFilterBar value={catalogTab} onChange={() => {}} />
        </div>
        {loadState === "loading" ? (
          <p className="py-16 text-center text-sm text-white/40">Chargement du catalogue en ligne…</p>
        ) : loadState === "error" ? (
          <p className="py-16 text-center text-sm text-red-400">{loadError}</p>
        ) : (
          <PreviewCatalogBody
            shopProducts={scopedProducts}
            sections={sections}
            maskingId={maskingId}
            onMask={handleMask}
          />
        )}
      </section>
    </div>
  );
}
