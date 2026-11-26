"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DingryProductImage } from "@/components/atoms/dingry-product-image";
import { PdpImageZoom } from "@/components/molecules/pdp-image-zoom";
import { DingryVariantProductImage } from "@/components/molecules/dingry-variant-product-image";
import { WishlistIconButton } from "@/components/atoms/wishlist-icon-button";
import { ProductImageFlip } from "@/components/molecules/product-image-flip";
import {
  isTurnstileProductTestEnabled,
  ProductCaptchaTest,
} from "@/components/molecules/product-captcha-test";
import { isShopProductInStock, type ShopProduct } from "@/lib/catalog";
import { useShopVitrineAmbience } from "@/hooks/use-shop-vitrine-ambience";
import { catalogRectoId, productDetailCopy, storefrontProductTitle } from "@/lib/dingry-product-display";
import {
  PDP_ADDED_FR,
  PDP_CHOOSE_SIZE_FR,
  PDP_SECURE_PAYMENT_FR,
  hasPdpSizeGuide,
  pdpDisplayTitle,
  pdpFreeShippingMessage,
  pdpKeySellingPoints,
  pdpLimitedEditionBadge,
  pdpSubtitle,
  showPdpCustomButton,
  showPdpFreeShippingReassurance,
} from "@/lib/storefront/pdp-display";
import { shouldShowPdpColorPicker } from "@/lib/storefront/pdp-color-swatches";
import { SHIPPING_FREE_THRESHOLD } from "@/lib/storefront/shipping-free-threshold";
import { shopProductColorVariants, similarProductsForShop } from "@/lib/storefront/similar-products";
import { ProductColorVariantGrid } from "@/components/molecules/product-color-variant-grid";
import { SimilarProductsStrip } from "@/components/molecules/similar-products-strip";
import { isJerseyShopProduct, JERSEY_COLOR_OPTIONS } from "@/lib/jersey-shop";
import { colorSwatchChipStyle } from "@/lib/storefront/color-swatch-chip";
import { isShopTeeCategory, resolveShopCategory } from "@/lib/shop-catalog";
import type { ShopAtelierCustomConfig } from "@/lib/atelier-custom-config";
import { IMAGES, TEE_VERSO_BY_RECTO_ID } from "@/lib/shop-data";
import {
  findActiveFlipPair,
  modalSizesFor,
  resolveSaleProduct,
  sizeGridColumns,
  type FlipPair,
} from "@/lib/shop-view";
import type { ProductModalState } from "./hooks/use-product-modal";
import { MODAL_OVERLAY_TRANSITION, MODAL_PANEL_SPRING } from "./motion";
import styles from "./product-modal.module.css";
import { productModalDataFromShop, type ProductModalProps as ProductModalShellProps } from "./product-modal.types";

export type { ProductModalData, ProductModalProps } from "./product-modal.types";

/** Id stable pour `aria-labelledby` (aligné personalize-modal / MWG). */
export const DINGRY_PRODUCT_MODAL_TITLE_ID = "dingry-product-modal-title";

/** Images décoratives modale (fond, miniatures) : pas de concurrence LCP. */
export const PRODUCT_MODAL_DECORATIVE_IMG = {
  loading: "lazy",
  fetchPriority: "low",
  decoding: "async",
} as const;

import {
  getShopOverlayFocusableElements,
  resolveShopOverlayTabFocus,
  shouldTrapShopOverlayTab,
  type ShopOverlayTabDirection,
} from "./shop-overlay-focus-trap";

/** Éléments focusables dans le panneau (pour piège Tab). */
export const getProductModalFocusableElements = getShopOverlayFocusableElements;

export type ProductModalTabDirection = ShopOverlayTabDirection;

/** Cible du prochain focus si Tab doit rester dans la modale (boucle). */
export const resolveProductModalTabFocus = resolveShopOverlayTabFocus;

/** Vrai si Tab / Maj+Tab doit être intercepté (bord du piège). */
export const shouldTrapProductModalTab = shouldTrapShopOverlayTab;

type ShopProductModalProps = {
  modal: ProductModalState;
  products: ShopProduct[];
  flipPairs: FlipPair[];
  wishlistIds: readonly number[];
  onToggleWishlist: (rectoId: number) => void;
  onAddToCart: (from: HTMLElement) => void;
  atelierConfig?: ShopAtelierCustomConfig;
  onOpenCustom?: (product: ShopProduct, size: string) => void;
  purchaseDisabled?: boolean;
};

export function ProductModal(props: ShopProductModalProps) {
  const product = props.modal.selectedProduct;
  const data = product ? productModalDataFromShop(product) : null;
  const shell: ProductModalShellProps = {
    data,
    onClose: props.modal.closeProductModal,
  };
  return (
    <AnimatePresence>
      {product && data ? (
        <ProductModalContent product={product} shell={shell} {...props} />
      ) : null}
    </AnimatePresence>
  );
}

type ContentProps = ShopProductModalProps & {
  product: ShopProduct;
  shell: ProductModalShellProps;
};

function ProductModalContent({
  product,
  shell,
  modal,
  products,
  flipPairs,
  wishlistIds,
  onToggleWishlist,
  onAddToCart,
  onOpenCustom,
  purchaseDisabled = false,
}: ContentProps) {
  const { ambience, objectPosition } = useShopVitrineAmbience();
  const { modalSide, jerseyColor, selectedSize, selectedQuantity, selectedOptionKey, switchParentOption, modalHeroImage } =
    modal;
  const [zoomOpen, setZoomOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [addFeedback, setAddFeedback] = useState<"idle" | "added">("idle");
  const parentOptions = product.options ?? [];
  const isJersey = isJerseyShopProduct(product);
  const catalogColorVariants = shopProductColorVariants(product.id, products);
  const showCatalogColorGrid = catalogColorVariants.length > 1 && !isJersey;
  const useParentOptions = parentOptions.length > 1 && !showCatalogColorGrid;

  const activeFlipPair = findActiveFlipPair(product, flipPairs);
  const teeVersoMeta = TEE_VERSO_BY_RECTO_ID[product.id];
  const showSideToggle = Boolean(activeFlipPair || teeVersoMeta);
  const saleProduct = resolveSaleProduct(product, products, jerseyColor);
  const outOfStock = !isShopProductInStock(saleProduct);
  const cannotPurchase = purchaseDisabled || outOfStock;
  const showCustomCta = Boolean(onOpenCustom) && showPdpCustomButton(product.id);
  const displayProduct = isJersey ? saleProduct : product;

  const activeView: Pick<ShopProduct, "image" | "name"> = activeFlipPair
    ? modalSide === "verso"
      ? activeFlipPair.verso
      : activeFlipPair.recto
    : teeVersoMeta && modalSide === "verso"
      ? { image: IMAGES[teeVersoMeta.image], name: product.name }
      : { image: useParentOptions ? modalHeroImage(product) : displayProduct.image, name: displayProduct.name };

  const flipImages = showSideToggle
    ? activeFlipPair
      ? { front: activeFlipPair.recto.image, back: activeFlipPair.verso.image }
      : teeVersoMeta
        ? {
            front: useParentOptions ? modalHeroImage(product) : product.image,
            back: IMAGES[teeVersoMeta.image],
          }
        : null
    : null;

  const crmFlipImages =
    !showSideToggle && product.imageBack?.trim()
      ? {
          front: useParentOptions ? modalHeroImage(product) : displayProduct.image,
          back: product.imageBack.trim(),
        }
      : null;
  const effectiveFlipImages = flipImages ?? crmFlipImages;
  const showCrmFlip = Boolean(crmFlipImages);
  const effectiveShowSideToggle = showSideToggle || showCrmFlip;

  const rectoId = catalogRectoId(product.id);
  const detail = productDetailCopy(product, products);
  const showGalleryColorLine = catalogColorVariants.length > 1;
  const crossSellProducts = similarProductsForShop(product.id, products).crossSell;
  const wishlistActive = wishlistIds.includes(rectoId);
  const limitedBadge = pdpLimitedEditionBadge(product);
  const displayTitle = pdpDisplayTitle(product, products);
  const displaySubtitle = pdpSubtitle(product, products);
  const sellingPoints = pdpKeySellingPoints(product);
  const shortDescription = product.description?.trim() || "";
  const sizeGuideCopy = detail.sizeGuide?.trim();
  const showSizeGuide = hasPdpSizeGuide(sizeGuideCopy ?? undefined);
  const showFreeShipping = showPdpFreeShippingReassurance(SHIPPING_FREE_THRESHOLD);
  const sizes = modalSizesFor(product);
  const sizeCols = sizeGridColumns(sizes);

  const shopCategory = resolveShopCategory(product.id, product.category);
  const showTurnstileProductTest =
    isTurnstileProductTestEnabled() && isShopTeeCategory(String(shopCategory));

  const data = shell.data;
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openerFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setZoomOpen(false);
    setSizeGuideOpen(false);
    setAddFeedback("idle");
  }, [product.id]);

  useEffect(() => {
    const opener = document.activeElement;
    openerFocusRef.current = opener instanceof HTMLElement ? opener : null;

    const raf = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const panel = modal.productModalRef.current;
    if (!panel) {
      return () => {
        window.cancelAnimationFrame(raf);
        const previous = openerFocusRef.current;
        if (previous?.isConnected) previous.focus();
      };
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const direction: ProductModalTabDirection = event.shiftKey ? "prev" : "next";
      const focusables = getProductModalFocusableElements(panel);
      const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (!shouldTrapProductModalTab(direction, focusables, active)) return;
      const target = resolveProductModalTabFocus(direction, focusables, active);
      if (!target) return;
      event.preventDefault();
      target.focus();
    };

    panel.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(raf);
      panel.removeEventListener("keydown", onKeyDown);
      const previous = openerFocusRef.current;
      if (previous?.isConnected) previous.focus();
    };
  }, [modal.productModalRef]);

  if (!data) return null;

  const sizeGridVars = {
    "--size-cols": String(sizeCols),
  } as CSSProperties;

  const heroAlt = storefrontProductTitle(product, products);
  const heroZoomSrc = activeView.image;

  const onGalleryKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!effectiveShowSideToggle) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      modal.showProductSide("recto");
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      modal.showProductSide("verso");
    }
  };

  const addButtonLabel =
    addFeedback === "added"
      ? PDP_ADDED_FR
      : purchaseDisabled
        ? "Catalogue indisponible"
        : outOfStock
          ? "Épuisé"
          : "Ajouter au panier";

  const handleAddToCart = (from: HTMLElement) => {
    if (!selectedSize || cannotPurchase) return;
    setAddFeedback("added");
    onAddToCart(from);
  };

  const renderPurchaseActions = (className: string | undefined) => (
    <div className={className ?? styles.ctaStack}>
      {showCustomCta ? (
        <button
          type="button"
          onClick={() => {
            if (!selectedSize || !onOpenCustom) return;
            onOpenCustom(product, selectedSize);
          }}
          disabled={!selectedSize || cannotPurchase}
          className={`dingry-gold-pill-btn ${styles.addCustomBtn} ${selectedSize && !cannotPurchase ? styles.addBtnOn : styles.addBtnOff}`}
        >
          <span className="gold-text">CUSTOM</span>
        </button>
      ) : null}
      <button
        type="button"
        onClick={(event) => handleAddToCart(event.currentTarget)}
        disabled={!selectedSize || cannotPurchase || addFeedback === "added"}
        className={`dingry-pdp-add-btn dingry-gold-foil-bg ${styles.addBtnGold}`}
        aria-live="polite"
      >
        {addButtonLabel}
      </button>
    </div>
  );

  return (
    <div className={styles.root}>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={MODAL_OVERLAY_TRANSITION}
        onClick={shell.onClose}
        aria-hidden
      />
      <motion.div
        ref={modal.productModalRef}
        data-product-modal=""
        className={`${styles.panel} ${styles.dingryPdpDark} dingry-pdp-dark dingry-sale-ui`}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={MODAL_PANEL_SPRING}
        role="dialog"
        aria-modal="true"
        aria-labelledby={DINGRY_PRODUCT_MODAL_TITLE_ID}
      >
        <div className={styles.ambience} aria-hidden>
          <img
            src={ambience.imageUrl}
            alt=""
            className={styles.ambienceImg}
            style={{ objectPosition }}
            {...PRODUCT_MODAL_DECORATIVE_IMG}
          />
          <div className={styles.ambienceVeil} />
        </div>
        <div ref={modal.productImageRef} className={styles.photo}>
          <div className={styles.galleryLayout}>
            <div
              className={styles.galleryMain}
              tabIndex={effectiveShowSideToggle ? 0 : undefined}
              role={effectiveShowSideToggle ? "group" : undefined}
              aria-label={effectiveShowSideToggle ? "Galerie produit" : undefined}
              onKeyDown={onGalleryKeyDown}
            >
              {effectiveShowSideToggle && effectiveFlipImages ? (
                <button
                  type="button"
                  className={`${styles.galleryNavBtn} ${styles.galleryNavFlip}`}
                  aria-label={modalSide === "recto" ? "Voir le verso" : "Voir le recto"}
                  onClick={() =>
                    modal.showProductSide(modalSide === "recto" ? "verso" : "recto")
                  }
                >
                  {modalSide === "recto" ? "›" : "‹"}
                </button>
              ) : null}
              <div className={styles.photoStage}>
                {effectiveFlipImages ? (
                  <ProductImageFlip
                    frontImage={effectiveFlipImages.front}
                    backImage={effectiveFlipImages.back}
                    side={modalSide}
                    presentation="modal"
                    alt={heroAlt}
                    className={styles.photoFallback}
                    imgClassName={styles.photoCover}
                    onRequestSide={modal.showProductSide}
                    onModalImageClick={() => setZoomOpen(true)}
                  />
                ) : useParentOptions ? (
                  <div
                    className={styles.photoFallback}
                    role="button"
                    tabIndex={0}
                    onClick={() => setZoomOpen(true)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setZoomOpen(true);
                      }
                    }}
                    aria-label="Agrandir l’image produit"
                  >
                    <DingryVariantProductImage
                      productName={product.name}
                      parentImage={product.image}
                      parentAlt={activeView.name}
                      options={parentOptions}
                      selectedOptionKey={selectedOptionKey}
                      presentation="modal"
                      className={styles.photoFallback}
                      imgClassName={styles.photoCover}
                    />
                  </div>
                ) : (
                  <div
                    className={styles.photoFallback}
                    role="button"
                    tabIndex={0}
                    onClick={() => setZoomOpen(true)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setZoomOpen(true);
                      }
                    }}
                    aria-label="Agrandir l’image produit"
                  >
                    <DingryProductImage
                      src={activeView.image}
                      alt={activeView.name}
                      width={600}
                      height={800}
                      deliveryWidth={720}
                      priority
                      className={styles.photoCover}
                      sizes="(max-width: 768px) 100vw, min(50vw, 600px)"
                      fitContent
                    />
                  </div>
                )}
              </div>
            </div>
            {showGalleryColorLine ? (
              <div className={styles.similarStripGallery}>
                <SimilarProductsStrip
                  variantCards={catalogColorVariants}
                  catalog={products}
                  onPickCrossSell={modal.switchProductVariant}
                  tone="pdp-dark"
                  presentation="pdp-gallery"
                />
              </div>
            ) : null}
          </div>
          <PdpImageZoom open={zoomOpen} src={heroZoomSrc} alt={heroAlt} onClose={() => setZoomOpen(false)} />
        </div>
        <div className={styles.body}>
          <div className={styles.bodyScroll}>
            <div className={styles.toolbar}>
              <div className={styles.toolbarCluster}>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={shell.onClose}
                  className={styles.close}
                  aria-label="Fermer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <WishlistIconButton
                  size="md"
                  active={wishlistActive}
                  label={wishlistActive ? "Retirer de la wishlist" : "Ajouter à la wishlist"}
                  onClick={() => onToggleWishlist(rectoId)}
                  className={styles.wishlist}
                />
              </div>
            </div>
            {limitedBadge ? <p className={styles.limitedBadge}>Édition limitée</p> : null}
            <h2 id={DINGRY_PRODUCT_MODAL_TITLE_ID} className={styles.title}>
              {displayTitle}
            </h2>
            {displaySubtitle ? <p className={styles.subtitle}>{displaySubtitle}</p> : null}
            <div className={styles.priceBlock}>
              <p className={`${styles.priceValue} dingry-gold-foil-text`} aria-live="polite">
                {saleProduct.price}€
              </p>
              <div className={styles.qtyControlColumn}>
                <span className={styles.qtyLabel}>Quantité</span>
                <div className={styles.qtyControl}>
                  <button
                    type="button"
                    onClick={() => modal.setSelectedQuantity((quantity) => Math.max(1, quantity - 1))}
                    aria-label="Diminuer la quantité"
                    className={styles.qtyBtn}
                  >
                    −
                  </button>
                  <span className={styles.qtyValue} aria-live="polite">
                    {selectedQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => modal.setSelectedQuantity((quantity) => Math.min(99, quantity + 1))}
                    aria-label="Augmenter la quantité"
                    className={styles.qtyBtn}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            {shortDescription ? <p className={styles.description}>{shortDescription}</p> : null}
            {sellingPoints.length > 0 ? (
              <ul className={styles.keyPoints}>
                {sellingPoints.map((point) => (
                  <li key={point} className={styles.keyPoint}>
                    {point}
                  </li>
                ))}
              </ul>
            ) : null}
            {detail.printPlacement ? (
              <div className={styles.metaBlock}>
                <p className={styles.metaLabel}>Impression</p>
                <p className={styles.metaText}>{detail.printPlacement}</p>
              </div>
            ) : null}
            {showCatalogColorGrid && shouldShowPdpColorPicker(catalogColorVariants) ? (
              <ProductColorVariantGrid
                variants={catalogColorVariants}
                onPickVariant={modal.switchProductVariant}
                presentation="pdp"
              />
            ) : useParentOptions ? (
              <div className={styles.section}>
                <p className={styles.sectionLabel}>Couleur</p>
                <div className={styles.chipRow}>
                  {parentOptions.map((option) => {
                    const isActive = option.optionKey === selectedOptionKey;
                    return (
                      <button
                        key={option.optionKey}
                        type="button"
                        onClick={() => switchParentOption(option.optionKey)}
                        className={`${styles.chip} ${styles.colorSwatchChip} ${isActive ? styles.colorSwatchChipOn : ""}`}
                        style={colorSwatchChipStyle(option.label, option.color, option.optionKey)}
                        aria-pressed={isActive}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {isJersey ? (
              <div className={styles.section}>
                <p className={styles.sectionLabel}>Couleur</p>
                <div className={styles.chipRow}>
                  {JERSEY_COLOR_OPTIONS.map((option) => {
                    const isActive = jerseyColor === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => modal.setJerseyColor(option.key)}
                        className={`${styles.chip} ${styles.colorSwatchChip} ${isActive ? styles.colorSwatchChipOn : ""}`}
                        style={colorSwatchChipStyle(option.label, option.key)}
                        aria-pressed={isActive}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {crossSellProducts.length > 0 ? (
              <div className={styles.similarCrossSellScroll}>
                <SimilarProductsStrip
                  crossSell={crossSellProducts}
                  catalog={products}
                  onPickCrossSell={modal.openProductModal}
                  tone="pdp-dark"
                />
              </div>
            ) : null}
          </div>
          <div className={`${styles.purchasePrimary} ${styles.purchaseDock}`}>
            <div className={styles.sizeGuideRow}>
              <p className={styles.sizeLabel} aria-live="polite">
                {selectedSize ? "Taille" : PDP_CHOOSE_SIZE_FR}
              </p>
              {showSizeGuide ? (
                <button
                  type="button"
                  className={styles.sizeGuideLink}
                  aria-expanded={sizeGuideOpen}
                  onClick={() => setSizeGuideOpen((open) => !open)}
                >
                  Guide des tailles
                </button>
              ) : null}
            </div>
            {sizeGuideOpen && showSizeGuide && sizeGuideCopy !== undefined ? (
              <div className={styles.sizeGuidePanel} id="dingry-pdp-size-guide">
                {sizeGuideCopy}
              </div>
            ) : null}
            <div className={styles.sizeGrid} style={sizeGridVars}>
              {sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={selectedSize === s}
                  onClick={() => modal.setSelectedSize(s)}
                  onPointerDown={(event) => {
                    if (event.pointerType === "touch") modal.setSelectedSize(s);
                  }}
                  className={`${styles.sizeBtn} ${selectedSize === s ? styles.sizeOn : ""}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className={`${styles.ctaStack} ${styles.ctaStackDesktop}`}>
              {renderPurchaseActions(styles.ctaStack)}
            </div>
            <motion.div
              className={styles.reassurance}
              initial={false}
              transition={MODAL_OVERLAY_TRANSITION}
            >
              {showFreeShipping && SHIPPING_FREE_THRESHOLD !== null ? (
                <p className={styles.reassuranceItem}>
                  {pdpFreeShippingMessage(SHIPPING_FREE_THRESHOLD)}
                </p>
              ) : null}
              <p className={styles.reassuranceItem}>{PDP_SECURE_PAYMENT_FR}</p>
            </motion.div>
          </div>
          <div className={styles.mobileStickyBar}>{renderPurchaseActions(styles.ctaStack)}</div>
          {showTurnstileProductTest ? <ProductCaptchaTest /> : null}
        </div>
      </motion.div>
    </div>
  );
}
