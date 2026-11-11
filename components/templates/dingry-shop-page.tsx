"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { storefrontProductTitle } from "@/lib/dingry-product-display";
import { shopProductCanonicalPath, shopProductDocumentTitle } from "@/lib/seo/shop-product-seo";
import { LazyWhenVisible } from "@/components/molecules/lazy-when-visible";
import { BackgroundGradientAnimation } from "@/components/atoms/ui/background-gradient-animation";
import { CatalogSection } from "@/components/organisms/shop/catalog-section";
import { DINGRY_SHOP_SHELL_CLASS } from "@/components/organisms/shop/catalog-layout";
import { useCatalogFilter } from "@/components/organisms/shop/hooks/use-catalog-filter";
import { usePageScroll } from "@/components/organisms/shop/hooks/use-page-scroll";
import { useProductModal } from "@/components/organisms/shop/hooks/use-product-modal";
import { useShopCart } from "@/components/organisms/shop/hooks/use-shop-cart";
import { useShopCatalog } from "@/components/organisms/shop/hooks/use-shop-catalog";
import { useShopAtelierCustom } from "@/components/organisms/shop/hooks/use-shop-atelier-custom";
import { useShopPersoBanner } from "@/components/organisms/shop/hooks/use-shop-perso-banner";
import { FlyAnimationProvider, useFlyAnimation } from "@/hooks/use-fly-animation";
import { useAdminSessionProbe } from "@/components/organisms/admin/hooks/use-admin-session";
import { useWishlist } from "@/hooks/use-wishlist";
import type { PersonalizedLineInput } from "@/components/organisms/shop/personalize-modal";
import { ShopHero } from "@/components/organisms/shop/shop-hero";
import { ShopNav } from "@/components/organisms/shop/shop-nav";
import { isShopProductInStock } from "@/lib/catalog";
import { CATALOG_MENU_TAB_CUSTOM, parseCatalogFilter } from "@/lib/shop-catalog";
import {
  enabledAtelierModels,
  resolvePersonalizationShopProduct,
} from "@/lib/atelier-custom-config";
import { PERSONALIZABLE_PRODUCT_ID, PRODUCTS } from "@/lib/shop-data";
import { shopBasePathFromPathname, shopHref } from "@/lib/shop-base-path";
import { bannerConfiguratorInitialLabel } from "@/lib/custom-city-banner";
import {
  buildFlipPairs,
  resolveSaleProduct,
  visibleCatalogProducts,
} from "@/lib/shop-view";

const ProductModal = dynamic(
  () => import("@/components/organisms/shop/product-modal").then((m) => ({ default: m.ProductModal })),
  { ssr: false },
);

const PersonalizeModal = dynamic(
  () =>
    import("@/components/organisms/shop/personalize-modal").then((m) => ({ default: m.PersonalizeModal })),
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

const PaymentToast = dynamic(
  () => import("@/components/organisms/shop/payment-toast").then((m) => ({ default: m.PaymentToast })),
  { ssr: false },
);

const HeritageReader = dynamic(
  () => import("@/components/organisms/shop/heritage-reader").then((m) => ({ default: m.HeritageReader })),
  { ssr: false },
);

const prefetchLookbookStrip = () =>
  import("@/components/organisms/shop/lookbook-catalog-strip");

const prefetchHeritageSection = () => import("@/components/organisms/shop/heritage-section");

const prefetchAtelierCustomSection = () => import("@/components/organisms/shop/atelier-custom-section");

const prefetchShopFooter = () => import("@/components/organisms/shop-footer");

const LookbookCatalogStrip = dynamic(
  () =>
    prefetchLookbookStrip().then((m) => ({
      default: m.LookbookCatalogStrip,
    })),
  { ssr: false },
);

const HeritageSection = dynamic(
  () =>
    prefetchHeritageSection().then((m) => ({
      default: m.HeritageSection,
    })),
  { ssr: false },
);

const AtelierCustomSection = dynamic(
  () =>
    prefetchAtelierCustomSection().then((m) => ({
      default: m.AtelierCustomSection,
    })),
  { ssr: false },
);

const ShopFooter = dynamic(
  () =>
    prefetchShopFooter().then((m) => ({
      default: m.ShopFooter,
    })),
  { ssr: false },
);

/** Boutique : orchestre hooks + organisms/shop. */
function DingryShopPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shopBasePath = shopBasePathFromPathname(pathname ?? "/");
  const { pageScrollRef, scrollToSection, restoreScrollPosition } = usePageScroll();
  const { products, catalogState, retry } = useShopCatalog();
  const { config: atelierConfig } = useShopAtelierCustom({
    enabled: catalogState !== "loading",
  });
  const { banner: persoBanner } = useShopPersoBanner({
    enabled: catalogState === "ready",
  });
  const cart = useShopCart();
  const modal = useProductModal({ products, catalogState });
  const wishlist = useWishlist();
  const { authenticated: adminSession } = useAdminSessionProbe();
  const { launchFromElement } = useFlyAnimation();
  const { activeFilter, selectFilter } = useCatalogFilter(scrollToSection);
  const [personalizeOpen, setPersonalizeOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [heritageReaderOpen, setHeritageReaderOpen] = useState(false);

  const filtered = useMemo(() => visibleCatalogProducts(products, activeFilter), [products, activeFilter]);
  const flipPairs = useMemo(() => buildFlipPairs(products), [products]);
  const personalizationProduct = useMemo(
    () =>
      products.find((p) => p.id === PERSONALIZABLE_PRODUCT_ID) ??
      PRODUCTS.find((p) => p.id === PERSONALIZABLE_PRODUCT_ID),
    [products],
  );

  const tabValue = personalizeOpen ? CATALOG_MENU_TAB_CUSTOM : activeFilter;
  const [cartScrollLocked, setCartScrollLocked] = useState(false);

  const openHeritageReader = useCallback(() => {
    setHeritageReaderOpen(true);
    const next = `${shopHref(shopBasePath, "/")}?heritage=1`;
    router.replace(next, { scroll: false });
  }, [router, shopBasePath]);

  const closeHeritageReader = useCallback(() => {
    setHeritageReaderOpen(false);
    router.replace(shopHref(shopBasePath, "/"), { scroll: false });
  }, [router, shopBasePath]);

  useEffect(() => {
    if (searchParams.get("heritage") === "1") {
      setHeritageReaderOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const scroller = pageScrollRef.current;
    if (!scroller) return;
    if (!heritageReaderOpen) return;
    const previous = scroller.style.overflow;
    scroller.style.overflow = "hidden";
    return () => {
      scroller.style.overflow = previous;
    };
  }, [heritageReaderOpen, pageScrollRef]);

  useEffect(() => {
    if (cart.open) setCartScrollLocked(true);
  }, [cart.open]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const scroller = pageScrollRef.current;
    if (!scroller) return;
    scroller.style.overflow = cartScrollLocked ? "hidden" : "";
    return () => {
      scroller.style.overflow = "";
    };
  }, [cartScrollLocked, pageScrollRef]);

  useEffect(() => {
    if (catalogState !== "ready") return;
    restoreScrollPosition();
  }, [catalogState, restoreScrollPosition]);

  useEffect(() => {
    const selected = modal.selectedProduct;
    if (!selected) return;
    const titleBase = storefrontProductTitle(selected, products);
    document.title = shopProductDocumentTitle(titleBase);
    const canonicalPath = shopProductCanonicalPath(
      shopBasePath,
      { id: selected.id, name: selected.name, category: String(selected.category) },
      { produit: searchParams.get("produit") },
    );
    const href = new URL(canonicalPath, window.location.origin).toString();
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [modal.selectedProduct, products, shopBasePath, searchParams]);

  const handleTabChange = useCallback(
    (tab: string) => {
      if (tab === CATALOG_MENU_TAB_CUSTOM) {
        setPersonalizeOpen(true);
        return;
      }
      setPersonalizeOpen(false);
      selectFilter(parseCatalogFilter(tab));
    },
    [selectFilter],
  );

  const [bannerSeedLabel, setBannerSeedLabel] = useState<string | null>(null);
  const consumeBannerSeed = useCallback(() => setBannerSeedLabel(null), []);

  const openCustom = useCallback((options?: { initialLabel?: string }) => {
    const raw = options?.initialLabel?.trim();
    if (raw) {
      setBannerSeedLabel(bannerConfiguratorInitialLabel(raw));
    }
    setPersonalizeOpen(true);
  }, []);

  function addToCart(from: HTMLElement) {
    const { selectedProduct, selectedSize, selectedQuantity, jerseyColor } = modal;
    if (catalogState === "error") return;
    if (!selectedProduct || !selectedSize) return;
    if (!isShopProductInStock(selectedProduct)) return;
    const saleProduct = resolveSaleProduct(selectedProduct, products, jerseyColor);
    cart.addLine(saleProduct, selectedSize, selectedQuantity);
    modal.clearSelectionAfterAdd();
    launchFromElement(from, "cart", "cart");
  }

  function addPersonalized(line: PersonalizedLineInput) {
    if (catalogState === "error") return;
    const models = enabledAtelierModels(atelierConfig);
    const model =
      models.find((m) => m.id === line.modelId || m.productId === line.productId) ?? models[0];
    const product =
      (model ? resolvePersonalizationShopProduct(products, model, PRODUCTS) : undefined) ??
      personalizationProduct;
    if (!product) return;
    cart.addPersonalizedLine(product, line.size, line.qty, line.personalization);
    setPersonalizeOpen(false);
  }

  function goToCheckout() {
    if (catalogState === "error") return;
    cart.persist();
    cart.setOpen(false);
    router.push("/checkout");
  }

  return (
    <div className="dingry-shop relative h-dvh w-full overflow-x-hidden overflow-hidden bg-black text-white">
      <BackgroundGradientAnimation
        interactive={false}
        paused={
          Boolean(modal.selectedProduct) ||
          cart.open ||
          wishlistOpen ||
          personalizeOpen ||
          heritageReaderOpen
        }
      />
      <ShopNav
        shopBasePath={shopBasePath}
        cartCount={cart.count}
        favoriteCount={wishlist.favoriteCount}
        onOpenFavorites={() => setWishlistOpen(true)}
        onOpenCart={() => cart.setOpen(true)}
        onScrollToSection={scrollToSection}
        onOpenHeritage={openHeritageReader}
      />
      <div
        ref={pageScrollRef}
        className="dingry-page relative z-10 h-full overflow-x-hidden overflow-y-auto overscroll-y-contain bg-transparent [overflow-anchor:none]"
      >
        <ShopHero />
        <div className={DINGRY_SHOP_SHELL_CLASS}>
          <div id="catalogue-landing" />
          <CatalogSection
            tabValue={tabValue}
            onTabChange={handleTabChange}
            catalogState={catalogState}
            onRetry={retry}
            filterKey={activeFilter}
            products={filtered}
            flipPairs={flipPairs}
            onOpenProduct={modal.openProductModal}
            wishlistIds={wishlist.ids}
            onToggleWishlist={wishlist.toggle}
            showAdminIdBadge={adminSession}
          />
          <LazyWhenVisible
            scrollRootRef={pageScrollRef}
            id="atelier-custom"
            prefetch={prefetchAtelierCustomSection}
            rootMargin="480px 0px 48px 0px"
            placeholderClassName="dingry-gold-rule-top min-h-[16rem] [contain-intrinsic-size:auto_16rem]"
          >
            <AtelierCustomSection onOpenCustom={openCustom} persoBanner={persoBanner} />
          </LazyWhenVisible>
          <LazyWhenVisible
            scrollRootRef={pageScrollRef}
            id="heritage"
            prefetch={prefetchHeritageSection}
            rootMargin="420px 0px 48px 0px"
            placeholderClassName="dingry-gold-rule-top min-h-[14rem] [contain-intrinsic-size:auto_14rem]"
          >
            <HeritageSection onOpenHeritage={openHeritageReader} />
          </LazyWhenVisible>
          <LazyWhenVisible
            scrollRootRef={pageScrollRef}
            id="lookbook"
            prefetch={prefetchLookbookStrip}
            rootMargin="520px 0px 48px 0px"
            placeholderClassName="dingry-gold-rule-top min-h-[18rem] [contain-intrinsic-size:auto_18rem]"
          >
            <LookbookCatalogStrip />
          </LazyWhenVisible>
          <LazyWhenVisible
            scrollRootRef={pageScrollRef}
            prefetch={prefetchShopFooter}
            rootMargin="320px 0px 32px 0px"
            placeholderClassName="min-h-32 [contain-intrinsic-size:auto_8rem]"
          >
            <ShopFooter
              shopBasePath={shopBasePath}
              onScrollToCatalogue={() => scrollToSection("catalogue")}
              onScrollToSection={scrollToSection}
              onOpenHeritage={openHeritageReader}
              onSelectCatalogFilter={(filter) => {
                selectFilter(filter);
                scrollToSection("catalogue");
              }}
              onOpenAtelierCustom={() => {
                scrollToSection("atelier-custom");
                openCustom();
              }}
            />
          </LazyWhenVisible>
        </div>
      </div>

      <PersonalizeModal
        open={personalizeOpen}
        products={products}
        atelierConfig={atelierConfig}
        fallbackProduct={personalizationProduct}
        bannerSeedLabel={bannerSeedLabel}
        onBannerSeedConsumed={consumeBannerSeed}
        onClose={() => setPersonalizeOpen(false)}
        onSubmit={addPersonalized}
      />
      <ProductModal
        modal={modal}
        products={products}
        flipPairs={flipPairs}
        wishlistIds={wishlist.ids}
        onToggleWishlist={wishlist.toggle}
        onAddToCart={addToCart}
        purchaseDisabled={catalogState === "error"}
      />
      <PaymentToast visible={cart.toastVisible} />
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
          scrollToSection("catalogue");
        }}
      />
      <WishlistDrawer
        open={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        wishlistIds={wishlist.ids}
        products={products}
        shopBasePath={shopBasePath}
        purchaseDisabled={catalogState === "error"}
        onOpenProduct={modal.openProductModal}
        onToggleWishlist={wishlist.toggle}
        onDiscoverCollection={() => {
          setWishlistOpen(false);
          scrollToSection("catalogue");
        }}
        onAddToCart={(product, size, from) => {
          if (catalogState === "error") return;
          if (!isShopProductInStock(product)) return;
          cart.addLine(product, size, 1);
          launchFromElement(from, "cart", "cart");
        }}
      />
      <HeritageReader open={heritageReaderOpen} onClose={closeHeritageReader} />
    </div>
  );
}

export default function DingryShopPage() {
  return (
    <FlyAnimationProvider>
      <DingryShopPageInner />
    </FlyAnimationProvider>
  );
}
