"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BackgroundGradientAnimation } from "@/components/atoms/ui/background-gradient-animation";
import { DINGRY_SHOP_SHELL_CLASS } from "@/components/organisms/shop/catalog-layout";
import { HeritageEditorial } from "@/components/organisms/shop/heritage-editorial";
import { ShopNav } from "@/components/organisms/shop/shop-nav";
import { usePageScroll } from "@/components/organisms/shop/hooks/use-page-scroll";
import { useShopCart } from "@/components/organisms/shop/hooks/use-shop-cart";
import { useShopAuth } from "@/hooks/use-shop-auth";
import { useWishlist } from "@/hooks/use-wishlist";
import { DingryI18nProvider } from "@/hooks/use-translation";
import { FlyAnimationProvider, useFlyAnimation } from "@/hooks/use-fly-animation";
import { isShopProductInStock } from "@/lib/catalog";
import { useShopCatalog } from "@/components/organisms/shop/hooks/use-shop-catalog";
import { shopBasePathFromPathname, shopHref } from "@/lib/shop-base-path";
import { shopSectionHref } from "@/lib/shop-section-href";

const AuthModal = dynamic(
  () => import("@/components/auth/auth-modal").then((m) => ({ default: m.AuthModal })),
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

const ShopFooter = dynamic(
  () => import("@/components/organisms/shop-footer").then((m) => ({ default: m.ShopFooter })),
  { ssr: false },
);

function DingryHeritagePageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const shopBasePath = shopBasePathFromPathname(pathname ?? "/");
  const { pageScrollRef } = usePageScroll();
  const cart = useShopCart();
  const { products } = useShopCatalog();
  const wishlist = useWishlist();
  const shopAuth = useShopAuth();
  const { launchFromElement } = useFlyAnimation();
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState<string | undefined>();
  const [cartScrollLocked, setCartScrollLocked] = useState(false);

  const goToCheckout = useCallback(() => {
    router.push(shopHref(shopBasePath, "/checkout"));
  }, [router, shopBasePath]);

  const navigateToShopSection = useCallback(
    (sectionId: string) => {
      router.push(shopSectionHref(shopBasePath, sectionId));
    },
    [router, shopBasePath],
  );

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
      if (sectionId === "heritage" || sectionId === "heritage-top") {
        pageScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      navigateToShopSection(sectionId);
    },
    [navigateToShopSection, pageScrollRef],
  );

  return (
    <div className="dingry-shop relative h-dvh w-full overflow-x-hidden overflow-hidden bg-black text-white">
      <BackgroundGradientAnimation interactive={false} paused={cart.open || wishlistOpen || authOpen} />
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
        <div id="heritage-top" className={`${DINGRY_SHOP_SHELL_CLASS} pt-2 md:pt-4`}>
          <HeritageEditorial />
          <ShopFooter
            shopBasePath={shopBasePath}
            onScrollToCatalogue={() => navigateToShopSection("catalogue")}
            onScrollToSection={scrollOnPage}
            onOpenAtelierCustom={() => navigateToShopSection("atelier-custom")}
          />
        </div>
      </div>

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
        checkoutDisabled={false}
        onDiscoverCollection={() => {
          cart.setOpen(false);
          navigateToShopSection("catalogue");
        }}
      />
      <WishlistDrawer
        open={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        wishlistIds={wishlist.ids}
        products={products}
        shopBasePath={shopBasePath}
        purchaseDisabled={false}
        onOpenProduct={() => navigateToShopSection("catalogue")}
        onToggleWishlist={wishlist.toggleFavorite}
        onDiscoverCollection={() => {
          setWishlistOpen(false);
          navigateToShopSection("catalogue");
        }}
        onAddToCart={(product, size, from) => {
          if (!isShopProductInStock(product)) return;
          cart.addLine(product, size, 1);
          launchFromElement(from, "cart", "cart");
        }}
      />
      <AuthModal
        open={authOpen}
        reason={authReason}
        accountUser={shopAuth.user ? { email: shopAuth.user.email } : null}
        onSignOut={shopAuth.signOut}
        onClose={() => {
          setAuthOpen(false);
          setAuthReason(undefined);
        }}
      />
    </div>
  );
}

/** Espace sous la nav fixe sans hero. */
function TopNavSpacer() {
  return <div className="h-12 shrink-0 md:h-14" aria-hidden />;
}

export default function DingryHeritagePage() {
  return (
    <FlyAnimationProvider>
      <DingryI18nProvider>
        <DingryHeritagePageInner />
      </DingryI18nProvider>
    </FlyAnimationProvider>
  );
}
