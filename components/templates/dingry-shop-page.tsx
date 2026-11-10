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
import { useShopPersoBanner } from "@/components/organisms/shop/hooks/use-shop-perso-banner";
import { useWishlist } from "@/hooks/use-wishlist";
import type { PersonalizedLineInput } from "@/components/organisms/shop/personalize-modal";
import { ShopHero } from "@/components/organisms/shop/shop-hero";
import { ShopNav } from "@/components/organisms/shop/shop-nav";
import { isShopProductInStock } from "@/lib/catalog";
import { CATALOG_MENU_TAB_CUSTOM, parseCatalogFilter } from "@/lib/shop-catalog";
import { PERSONALIZABLE_PRODUCT_ID, PRODUCTS } from "@/lib/shop-data";
import { shopBasePathFromPathname } from "@/lib/shop-base-path";
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

const PaymentToast = dynamic(
  () => import("@/components/organisms/shop/payment-toast").then((m) => ({ default: m.PaymentToast })),
  { ssr: false },
);

const LookbookCatalogStrip = dynamic(
  () =>
    import("@/components/organisms/shop/lookbook-catalog-strip").then((m) => ({
      default: m.LookbookCatalogStrip,
    })),
  { loading: () => <div className="dingry-gold-rule-top min-h-[18rem]" aria-hidden /> },
);

const HeritageSection = dynamic(
  () =>
    import("@/components/organisms/shop/heritage-section").then((m) => ({
      default: m.HeritageSection,
    })),
  { loading: () => <div className="dingry-gold-rule-top min-h-[50vh]" aria-hidden /> },
);

const ShopFooter = dynamic(
  () =>
    import("@/components/organisms/shop-footer").then((m) => ({
      default: m.ShopFooter,
    })),
  { loading: () => <div className="dingry-gold-rule-top min-h-32" aria-hidden /> },
);

/** Boutique : orchestre hooks + organisms/shop. */
export default function DingryShopPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shopBasePath = shopBasePathFromPathname(pathname ?? "/");
  const { pageScrollRef, scrollToSection, restoreScrollPosition } = usePageScroll();
  const { products, catalogState, retry } = useShopCatalog();
  const { banner: persoBanner } = useShopPersoBanner({
    enabled: catalogState === "ready",
  });
  const cart = useShopCart();
  const modal = useProductModal({ products, catalogState });
  const wishlist = useWishlist();
  const { activeFilter, selectFilter } = useCatalogFilter(scrollToSection);
  const [personalizeOpen, setPersonalizeOpen] = useState(false);

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

  const openCustom = useCallback(() => setPersonalizeOpen(true), []);

  function addToCart() {
    const { selectedProduct, selectedSize, selectedQuantity, jerseyColor, selectedOptionKey } = modal;
    if (catalogState === "error") return;
    if (!selectedProduct || !selectedSize) return;
    if (!isShopProductInStock(selectedProduct)) return;
    const saleProduct = resolveSaleProduct(selectedProduct, products, jerseyColor);
    cart.addLine(saleProduct, selectedSize, selectedQuantity);
    modal.clearSelectionAfterAdd();
  }

  function addPersonalized(line: PersonalizedLineInput) {
    if (catalogState === "error") return;
    if (!personalizationProduct) return;
    cart.addPersonalizedLine(personalizationProduct, line.size, line.qty, line.personalization);
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
        paused={Boolean(modal.selectedProduct) || cart.open || personalizeOpen}
      />
      <ShopNav
        shopBasePath={shopBasePath}
        cartCount={cart.count}
        favoriteCount={wishlist.favoriteCount}
        onOpenFavorites={() => scrollToSection("catalogue")}
        onOpenCart={() => cart.setOpen(true)}
        onScrollToSection={scrollToSection}
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
            onOpenCustom={openCustom}
            catalogState={catalogState}
            onRetry={retry}
            filterKey={activeFilter}
            products={filtered}
            flipPairs={flipPairs}
            onOpenProduct={modal.openProductModal}
            wishlistIds={wishlist.ids}
            onToggleWishlist={wishlist.toggle}
            persoBanner={persoBanner}
          />
          <LazyWhenVisible
            scrollRootRef={pageScrollRef}
            id="lookbook"
            placeholderClassName="dingry-gold-rule-top min-h-[18rem]"
          >
            <LookbookCatalogStrip />
          </LazyWhenVisible>
          <LazyWhenVisible
            scrollRootRef={pageScrollRef}
            id="heritage"
            placeholderClassName="dingry-gold-rule-top min-h-[50vh]"
          >
            <HeritageSection scrollContainerRef={pageScrollRef} />
          </LazyWhenVisible>
          <LazyWhenVisible scrollRootRef={pageScrollRef} placeholderClassName="min-h-32">
            <ShopFooter
              shopBasePath={shopBasePath}
              onScrollToCatalogue={() => scrollToSection("catalogue")}
            />
          </LazyWhenVisible>
        </div>
      </div>

      <PersonalizeModal
        open={personalizeOpen}
        product={personalizationProduct}
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
    </div>
  );
}
