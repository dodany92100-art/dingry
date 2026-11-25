"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BackgroundGradientAnimation } from "@/components/atoms/ui/background-gradient-animation";
import {
  CATALOG_SECTION_SURFACE_CLASS,
  CATALOG_VITRINE_SHELL_CLASS,
  DINGRY_SHOP_LOWER_BAND_CLASS,
  DINGRY_SHOP_SHELL_CLASS,
} from "@/components/organisms/shop/catalog-layout";
import { BrandPageEditorial } from "@/components/organisms/shop/brand-page-editorial";
import { CatalogGrid } from "@/components/organisms/shop/catalog-grid";
import { ShopNav } from "@/components/organisms/shop/shop-nav";
import { usePageScroll } from "@/components/organisms/shop/hooks/use-page-scroll";
import { useProductModal } from "@/components/organisms/shop/hooks/use-product-modal";
import { useShopCart } from "@/components/organisms/shop/hooks/use-shop-cart";
import { useShopCatalog } from "@/components/organisms/shop/hooks/use-shop-catalog";
import { DingryI18nProvider, useTranslation } from "@/hooks/use-translation";
import { useShopAuth } from "@/hooks/use-shop-auth";
import { useWishlist } from "@/hooks/use-wishlist";
import { FlyAnimationProvider, useFlyAnimation } from "@/hooks/use-fly-animation";
import { isShopProductInStock, type ShopProduct } from "@/lib/catalog";
import { DINGRY_MADA_COLLECTION, brandPageConfigForSlug } from "@/lib/shop-brand-page-config";
import { parseBrandPageSlug, type BrandPageSlug } from "@/lib/shop-brand-page-slug";
import { brandPageVisibleProducts } from "@/lib/filter-brand-catalog";
import { shopBasePathFromPathname, shopHref } from "@/lib/shop-base-path";
import { shopSectionHref } from "@/lib/shop-section-href";
import { buildFlipPairs, resolveSaleProduct } from "@/lib/shop-view";
import { toggleCatalogWishlistFavorite } from "@/lib/shop/catalog-wishlist-toggle";
const ProductModal = dynamic(
  () => import("@/components/organisms/shop/product-modal").then((m) => ({ default: m.ProductModal })),
  { ssr: false },
);

const CartDrawer = dynamic(
  () => import("@/components/organisms/shop/cart-drawer").then((m) => ({ default: m.CartDrawer })),
  { ssr: false },
);

const WishlistDrawer = dynamic(
  () => import("@/components/organisms/shop/wishlist-drawer").then((m) => ({ default: m.WishlistDrawer })),
  { ssr: false },
);

const AuthModal = dynamic(
  () => import("@/components/auth/auth-modal").then((m) => ({ default: m.AuthModal })),
  { ssr: false },
);

const ShopFooter = dynamic(
  () => import("@/components/organisms/shop-footer").then((m) => ({ default: m.ShopFooter })),
  { ssr: false },
);

type DingryBrandPageProps = {
  slug: string;
};

export default function DingryBrandPage({ slug }: DingryBrandPageProps) {
  return (
    <DingryI18nProvider>
      <FlyAnimationProvider>
        <DingryBrandPageInner slug={slug} />
      </FlyAnimationProvider>
    </DingryI18nProvider>
  );
}

function DingryBrandPageInner({ slug }: DingryBrandPageProps) {
  const pageSlug = parseBrandPageSlug(slug) as BrandPageSlug;
  const config = brandPageConfigForSlug(pageSlug);
  if (!config) return null;

  const router = useRouter();
  const pathname = usePathname();
  const shopBasePath = shopBasePathFromPathname(pathname ?? "/");
  const { pageScrollRef } = usePageScroll();
  const { products, catalogState, retry } = useShopCatalog();
  const cart = useShopCart();
  const wishlist = useWishlist();
  const shopAuth = useShopAuth();
  const modal = useProductModal({ products, catalogState });
  const { launchFromElement } = useFlyAnimation();
  const { t } = useTranslation();
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState<string | undefined>();
  const [cartScrollLocked, setCartScrollLocked] = useState(false);

  const flipPairs = useMemo(() => buildFlipPairs(products), [products]);

  const mainProducts = useMemo(() => {
    if (config.madaSection) {
      return brandPageVisibleProducts(products, config.brand, {
        excludeCollection: DINGRY_MADA_COLLECTION,
      });
    }
    return brandPageVisibleProducts(products, config.brand);
  }, [products, config.brand, config.madaSection]);

  const madaProducts = useMemo(() => {
    if (!config.madaSection) return [];
    return brandPageVisibleProducts(products, config.brand, {
      collection: config.madaSection.collection,
    });
  }, [products, config.brand, config.madaSection]);

  const onToggleCatalogWishlist = useCallback(
    (productId: number) => {
      toggleCatalogWishlistFavorite(productId, {
        isFavorite: wishlist.isFavorite,
        toggleFavorite: wishlist.toggleFavorite,
      });
    },
    [wishlist],
  );

  const navigateToShopSection = useCallback(
    (sectionId: string) => {
      router.push(shopSectionHref(shopBasePath, sectionId));
    },
    [router, shopBasePath],
  );

  const goToCheckout = useCallback(() => {
    router.push(shopHref(shopBasePath, "/checkout"));
  }, [router, shopBasePath]);

  const openAuth = useCallback((reason?: string) => {
    setAuthReason(reason);
    setAuthOpen(true);
  }, []);

  const openCart = useCallback(() => {
    if (cart.count > 0) {
      goToCheckout();
      return;
    }
    cart.setOpen(true);
  }, [cart, goToCheckout]);

  const addToCart = useCallback(
    (from: HTMLElement) => {
      if (catalogState === "error") return;
      const { selectedProduct, selectedSize, selectedQuantity, jerseyColor } = modal;
      if (!selectedProduct || !selectedSize) return;
      if (!isShopProductInStock(selectedProduct)) return;
      const saleProduct = resolveSaleProduct(selectedProduct, products, jerseyColor);
      cart.addLine(saleProduct, selectedSize, selectedQuantity);
      modal.clearSelectionAfterAdd();
      launchFromElement(from, "cart", "cart");
    },
    [cart, catalogState, launchFromElement, modal, products],
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (cart.open) setCartScrollLocked(true);
  }, [cart.open]);

  useEffect(() => {
    const scroller = pageScrollRef.current;
    if (!scroller) return;
    scroller.style.overflow = cartScrollLocked ? "hidden" : "";
    return () => {
      scroller.style.overflow = "";
    };
  }, [cartScrollLocked, pageScrollRef]);

  const scrollOnPage = useCallback(
    (sectionId: string) => {
      if (sectionId === "catalogue" || sectionId === "catalogue-landing") {
        pageScrollRef.current?.querySelector("#brand-catalog")?.scrollIntoView({ behavior: "smooth" });
        return;
      }
      navigateToShopSection(sectionId);
    },
    [navigateToShopSection, pageScrollRef],
  );

  return (
    <div className="dingry-shop dingry-brand-route relative h-dvh w-full overflow-x-hidden overflow-hidden bg-black text-white">
      <BackgroundGradientAnimation
        interactive={false}
        paused={Boolean(modal.selectedProduct) || cart.open || wishlistOpen || authOpen}
      />
      <ShopNav
        shopBasePath={shopBasePath}
        cartCount={cart.count}
        favoriteCount={wishlist.favoriteCount}
        accountActive={Boolean(shopAuth.user)}
        onOpenAccount={() => openAuth()}
        onOpenFavorites={() => setWishlistOpen(true)}
        onOpenCart={openCart}
        onScrollToSection={scrollOnPage}
        onOpenCustom={() => navigateToShopSection("atelier-custom")}
      />
      <div
        ref={pageScrollRef}
        className="dingry-page relative z-10 h-full overflow-x-hidden overflow-y-auto overscroll-y-contain bg-transparent [overflow-anchor:none]"
      >
        <TopNavSpacer />
        <div className={`${DINGRY_SHOP_SHELL_CLASS} pt-2 md:pt-4`}>
          <BrandPageEditorial config={config} />
          <section
            id="brand-catalog"
            className={`${CATALOG_SECTION_SURFACE_CLASS} ${CATALOG_VITRINE_SHELL_CLASS} mt-6`}
          >
            <h2 className="dingry-section-eyebrow mb-4 text-[10px] tracking-[0.2em]">
              {t("brandPages.productsHeading")}
            </h2>
            <CatalogGrid
              catalogState={catalogState}
              onRetry={retry}
              filterKey="all"
              products={mainProducts}
              onOpenProduct={modal.openProductModal}
              wishlistIds={wishlist.ids}
              onToggleWishlist={onToggleCatalogWishlist}
            />
          </section>
          {config.madaSection ? (
            <section
              id={config.madaSection.anchorId}
              className={`${CATALOG_SECTION_SURFACE_CLASS} ${CATALOG_VITRINE_SHELL_CLASS} mt-8`}
            >
              <h2 className="dingry-section-eyebrow mb-4 text-[10px] tracking-[0.2em]">
                {t("brandPages.madaProductsHeading")}
              </h2>
              <CatalogGrid
                catalogState={catalogState}
                onRetry={retry}
                filterKey="all"
                products={madaProducts}
                onOpenProduct={modal.openProductModal}
                wishlistIds={wishlist.ids}
                onToggleWishlist={onToggleCatalogWishlist}
              />
            </section>
          ) : null}
          <div className={DINGRY_SHOP_LOWER_BAND_CLASS}>
            <ShopFooter
              shopBasePath={shopBasePath}
              onScrollToCatalogue={() => scrollOnPage("catalogue")}
              onScrollToSection={scrollOnPage}
              onOpenAtelierCustom={() => navigateToShopSection("atelier-custom")}
            />
          </div>
        </div>
      </div>

      <ProductModal
        modal={modal}
        products={products}
        flipPairs={flipPairs}
        wishlistIds={wishlist.ids}
        onToggleWishlist={onToggleCatalogWishlist}
        onAddToCart={addToCart}
        purchaseDisabled={catalogState === "error"}
      />
      <CartDrawer
        open={cart.open}
        onClose={() => cart.setOpen(false)}
        onExitComplete={() => setCartScrollLocked(false)}
        items={cart.items}
        count={cart.count}
        total={cart.total}
        confirmation={cart.confirmation}
        onDismissConfirmation={cart.dismissConfirmation}
        onUpdateQuantity={cart.updateQuantity}
        onUpdateSize={cart.updateSize}
        onRemove={cart.removeLine}
        onCheckout={goToCheckout}
        checkoutDisabled={catalogState === "error"}
        onDiscoverCollection={() => {
          cart.setOpen(false);
          scrollOnPage("catalogue");
        }}
        catalogProducts={products}
      />
      <WishlistDrawer
        open={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        wishlistIds={wishlist.ids}
        products={products}
        shopBasePath={shopBasePath}
        purchaseDisabled={catalogState === "error"}
        onOpenProduct={(p: ShopProduct) => modal.openProductModal(p, "recto")}
        onToggleWishlist={wishlist.toggleFavorite}
        onDiscoverCollection={() => {
          setWishlistOpen(false);
          scrollOnPage("catalogue");
        }}
        onAddToCart={(product, size, from) => {
          if (!isShopProductInStock(product)) return;
          cart.addLine(product, size, 1);
          launchFromElement(from, "cart", "cart");
        }}
      />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} reason={authReason} />
    </div>
  );
}

function TopNavSpacer() {
  return <div className="h-[var(--dingry-nav-height,4.25rem)] shrink-0 md:h-[var(--dingry-nav-height-md,4.75rem)]" aria-hidden />;
}