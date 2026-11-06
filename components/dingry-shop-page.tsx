"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShopFooter } from "@/components/shop-footer";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { CatalogSection } from "@/components/shop/catalog-section";
import { HeritageSection } from "@/components/shop/heritage-section";
import { useCatalogFilter } from "@/components/shop/hooks/use-catalog-filter";
import { usePageScroll } from "@/components/shop/hooks/use-page-scroll";
import { useProductModal } from "@/components/shop/hooks/use-product-modal";
import { useShopCart } from "@/components/shop/hooks/use-shop-cart";
import { useShopCatalog } from "@/components/shop/hooks/use-shop-catalog";
import { useWishlist } from "@/components/shop/hooks/use-wishlist";
import { LookbookSection } from "@/components/shop/lookbook-section";
import { PaymentToast } from "@/components/shop/payment-toast";
import { PersonalizeModal, type PersonalizedLineInput } from "@/components/shop/personalize-modal";
import { ProductModal } from "@/components/shop/product-modal";
import { ShopHero } from "@/components/shop/shop-hero";
import { ShopNav } from "@/components/shop/shop-nav";
import { isShopProductInStock } from "@/lib/catalog";
import { CATALOG_MENU_TAB_CUSTOM, parseCatalogFilter } from "@/lib/shop-catalog";
import { PERSONALIZABLE_PRODUCT_ID, PRODUCTS } from "@/lib/shop-data";
import {
  buildFlipPairs,
  firstSwipeHintIndex,
  resolveSaleProduct,
  visibleCatalogProducts,
} from "@/lib/shop-view";

/** Boutique : orchestre les hooks et les blocs de components/shop/*. */
export default function DingryShopPage() {
  const router = useRouter();
  const { pageScrollRef, scrollToSection } = usePageScroll();
  const { products, catalogState, retry } = useShopCatalog();
  const cart = useShopCart();
  const modal = useProductModal({ products, catalogState });
  const wishlist = useWishlist();
  const { activeFilter, selectFilter } = useCatalogFilter(scrollToSection);
  const [personalizeOpen, setPersonalizeOpen] = useState(false);

  const filtered = useMemo(() => visibleCatalogProducts(products, activeFilter), [products, activeFilter]);
  const flipPairs = useMemo(() => buildFlipPairs(products), [products]);
  const swipeHintIndex = useMemo(() => firstSwipeHintIndex(filtered, flipPairs), [filtered, flipPairs]);
  const personalizationProduct = useMemo(
    () =>
      products.find((p) => p.id === PERSONALIZABLE_PRODUCT_ID) ??
      PRODUCTS.find((p) => p.id === PERSONALIZABLE_PRODUCT_ID),
    [products],
  );

  const tabValue = personalizeOpen ? CATALOG_MENU_TAB_CUSTOM : activeFilter;

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
    if (!selectedProduct || !selectedSize) return;
    if (!isShopProductInStock(selectedProduct)) return;
    const saleProduct = resolveSaleProduct(selectedProduct, products, jerseyColor);
    cart.addLine(saleProduct, selectedSize, selectedQuantity);
    modal.clearSelectionAfterAdd();
  }

  function addPersonalized(line: PersonalizedLineInput) {
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
    <div className="dingry-shop relative h-dvh overflow-hidden text-white">
      <BackgroundGradientAnimation interactive={false} />
      <ShopNav cartCount={cart.count} onOpenCart={() => cart.setOpen(true)} onScrollToSection={scrollToSection} />
      <div
        ref={pageScrollRef}
        className="dingry-page relative z-10 h-full overflow-y-auto bg-transparent [overflow-anchor:none]"
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
          swipeHintIndex={swipeHintIndex}
          onOpenProduct={modal.openProductModal}
        />
        <LookbookSection />
        <HeritageSection scrollContainerRef={pageScrollRef} />
        <ShopFooter />

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
        />
        <PaymentToast visible={cart.toastVisible} />
        <CartDrawer
          open={cart.open}
          onClose={() => cart.setOpen(false)}
          items={cart.items}
          count={cart.count}
          total={cart.total}
          confirmation={cart.confirmation}
          onDismissConfirmation={cart.dismissConfirmation}
          onUpdateQuantity={cart.updateQuantity}
          onRemove={cart.removeLine}
          onCheckout={goToCheckout}
          checkoutDisabled={catalogState === "error"}
        />
      </div>
    </div>
  );
}
