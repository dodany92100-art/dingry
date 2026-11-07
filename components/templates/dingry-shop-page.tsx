"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShopFooter } from "@/components/organisms/shop-footer";
import { BackgroundGradientAnimation } from "@/components/atoms/ui/background-gradient-animation";
import { CartDrawer } from "@/components/organisms/shop/cart-drawer";
import { CatalogSection } from "@/components/organisms/shop/catalog-section";
import { HeritageSection } from "@/components/organisms/shop/heritage-section";
import { useCatalogFilter } from "@/components/organisms/shop/hooks/use-catalog-filter";
import { usePageScroll } from "@/components/organisms/shop/hooks/use-page-scroll";
import { useProductModal } from "@/components/organisms/shop/hooks/use-product-modal";
import { useShopCart } from "@/components/organisms/shop/hooks/use-shop-cart";
import { useShopCatalog } from "@/components/organisms/shop/hooks/use-shop-catalog";
import { useShopPersoBanner } from "@/components/organisms/shop/hooks/use-shop-perso-banner";
import { useWishlist } from "@/components/organisms/shop/hooks/use-wishlist";
import { PaymentToast } from "@/components/organisms/shop/payment-toast";
import { PersonalizeModal, type PersonalizedLineInput } from "@/components/organisms/shop/personalize-modal";
import { ProductModal } from "@/components/organisms/shop/product-modal";
import { ShopHero } from "@/components/organisms/shop/shop-hero";
import { ShopNav } from "@/components/organisms/shop/shop-nav";
import { LookbookCatalogStrip } from "@/components/organisms/shop/lookbook-catalog-strip";
import { isShopProductInStock } from "@/lib/catalog";
import { CATALOG_MENU_TAB_CUSTOM, parseCatalogFilter } from "@/lib/shop-catalog";
import { PERSONALIZABLE_PRODUCT_ID, PRODUCTS } from "@/lib/shop-data";
import {
  buildFlipPairs,
  resolveSaleProduct,
  visibleCatalogProducts,
} from "@/lib/shop-view";

/** Boutique : orchestre hooks + organisms/shop. */
export default function DingryShopPage() {
  const router = useRouter();
  const { pageScrollRef, scrollToSection } = usePageScroll();
  const { products, catalogState, retry } = useShopCatalog();
  const { banner: persoBanner } = useShopPersoBanner();
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

  function handleTabChange(tab: string) {
    if (tab === CATALOG_MENU_TAB_CUSTOM) {
      setPersonalizeOpen(true);
      return;
    }
    setPersonalizeOpen(false);
    selectFilter(parseCatalogFilter(tab));
  }

  function addToCart() {
    const { selectedProduct, selectedSize, selectedQuantity, jerseyColor } = modal;
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
    <div className="dingry-shop relative h-dvh overflow-x-hidden overflow-hidden text-white">
      <BackgroundGradientAnimation interactive={false} />
      <ShopNav cartCount={cart.count} onOpenCart={() => cart.setOpen(true)} onScrollToSection={scrollToSection} />
      <div
        ref={pageScrollRef}
        className="dingry-page relative z-10 h-full overflow-x-hidden overflow-y-auto overscroll-y-contain bg-transparent [overflow-anchor:none]"
      >
        <ShopHero />
        <div id="catalogue-landing" />
        <CatalogSection
          tabValue={tabValue}
          onTabChange={handleTabChange}
          onOpenCustom={() => setPersonalizeOpen(true)}
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
        <LookbookCatalogStrip />
        <HeritageSection scrollContainerRef={pageScrollRef} />
        <ShopFooter onScrollToCatalogue={() => scrollToSection("catalogue")} />
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
      />
    </div>
  );
}
