"use client";

import type { CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DingryProductImage } from "@/components/atoms/dingry-product-image";
import { DingryVariantProductImage } from "@/components/molecules/dingry-variant-product-image";
import { WishlistIconButton } from "@/components/atoms/wishlist-icon-button";
import { ProductImageFlip } from "@/components/molecules/product-image-flip";
import {
  isTurnstileProductTestEnabled,
  ProductCaptchaTest,
} from "@/components/molecules/product-captcha-test";
import { isShopProductInStock, type ShopProduct } from "@/lib/catalog";
import { DINGRY_MANIFESTO_FR } from "@/lib/dingry-brand-voice";
import {
  catalogRectoId,
  completeLookForProduct,
  productDetailCopy,
  productLineForShop,
  storefrontProductTitle,
} from "@/lib/dingry-product-display";
import { isJerseyShopProduct, JERSEY_COLOR_OPTIONS } from "@/lib/jersey-shop";
import { isShopTeeCategory, resolveShopCategory } from "@/lib/shop-catalog";
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

type ShopProductModalProps = {
  modal: ProductModalState;
  products: ShopProduct[];
  flipPairs: FlipPair[];
  wishlistIds: readonly number[];
  onToggleWishlist: (rectoId: number) => void;
  onAddToCart: (from: HTMLElement) => void;
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
        <ProductModalContent key={product.id} product={product} shell={shell} {...props} />
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
  purchaseDisabled = false,
}: ContentProps) {
  const { modalSide, jerseyColor, selectedSize, selectedQuantity, selectedOptionKey, switchParentOption, modalHeroImage } =
    modal;
  const parentOptions = product.options ?? [];
  const useParentOptions = parentOptions.length > 1;

  const activeFlipPair = findActiveFlipPair(product, flipPairs);
  const teeVersoMeta = TEE_VERSO_BY_RECTO_ID[product.id];
  const showSideToggle = Boolean(activeFlipPair || teeVersoMeta);
  const isJersey = isJerseyShopProduct(product);
  const saleProduct = resolveSaleProduct(product, products, jerseyColor);
  const outOfStock = !isShopProductInStock(saleProduct);
  const cannotPurchase = purchaseDisabled || outOfStock;
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

  const productLine = productLineForShop(product.id, products);
  const rectoId = catalogRectoId(product.id);
  const detail = productDetailCopy(product, products);
  const completeLook = completeLookForProduct(product.id, products);
  const lineVariantProducts =
    productLine && productLine.variants.length > 1
      ? productLine.variants.flatMap((variant) => {
          const target = products.find((item) => catalogRectoId(item.id) === variant.rectoId);
          return target ? [{ product: target, variant, isActive: variant.rectoId === rectoId }] : [];
        })
      : [];
  const wishlistActive = wishlistIds.includes(rectoId);

  const sizes = modalSizesFor(product);
  const sizeCols = sizeGridColumns(sizes);
  const shopCategory = resolveShopCategory(product.id, product.category);
  const showTurnstileProductTest =
    isTurnstileProductTestEnabled() && isShopTeeCategory(String(shopCategory));

  const data = shell.data;
  if (!data) return null;

  const sizeGridVars = {
    "--size-cols": String(sizeCols),
  } as CSSProperties;

  return (
    <div className={styles.root}>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={MODAL_OVERLAY_TRANSITION}
        onClick={shell.onClose}
      />
      <motion.div
        ref={modal.productModalRef}
        data-product-modal=""
        className={`${styles.panel} dingry-sale-ui`}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={MODAL_PANEL_SPRING}
      >
        <div ref={modal.productImageRef} className={styles.photo}>
          <div className={styles.photoStage}>
            {effectiveFlipImages ? (
              <ProductImageFlip
                frontImage={effectiveFlipImages.front}
                backImage={effectiveFlipImages.back}
                side={modalSide}
                presentation="modal"
                alt={storefrontProductTitle(product, products)}
                className={styles.photoFallback}
                imgClassName={styles.photoCover}
              />
            ) : useParentOptions ? (
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
            ) : (
              <div className={styles.photoFallback}>
                <DingryProductImage
                  src={activeView.image}
                  alt={activeView.name}
                  width={600}
                  height={800}
                  deliveryWidth={720}
                  className={styles.photoCover}
                  sizes="(max-width: 768px) 100vw, min(50vw, 600px)"
                  fitContent
                />
              </div>
            )}
          </div>
        </div>
        <div className={styles.body}>
          <div>
            <div className={styles.toolbar}>
              <div className={styles.toolbarCluster}>
                <button
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
              </div>
            </div>
            <p className={`dingry-typo-manifesto ${styles.manifesto}`}>{DINGRY_MANIFESTO_FR}</p>
            <h2 className={styles.title}>{data.title}</h2>
            {detail.description ? (
              <p className={styles.description}>{detail.description}</p>
            ) : null}
            {detail.printPlacement ? (
              <div className={styles.metaBlock}>
                <p className={styles.metaLabel}>Impression</p>
                <p className={styles.metaText}>{detail.printPlacement}</p>
              </div>
            ) : null}
            {detail.limitedEdition ? (
              <div className={styles.metaBlock}>
                <p className={styles.metaLabel}>Édition limitée</p>
                <p className={styles.metaText}>{detail.limitedEdition}</p>
              </div>
            ) : null}
            {useParentOptions ? (
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
                        className={`${styles.chip} ${isActive ? styles.chipActive : ""}`}
                        aria-pressed={isActive}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <div className={styles.qtyRow}>
              <div className={styles.qtyLead}>
                <span className={styles.qtyLabel}>Quantité</span>
                <p className={styles.qtyPrice} aria-live="polite">
                  {saleProduct.price * selectedQuantity}€
                </p>
              </div>
              <div className={styles.qtyControl}>
                <button
                  type="button"
                  onClick={() => modal.setSelectedQuantity((quantity) => Math.max(1, quantity - 1))}
                  aria-label="Diminuer la quantité"
                  className={styles.qtyBtn}
                >
                  −
                </button>
                <span className={styles.qtyValue}>{selectedQuantity}</span>
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
            {effectiveShowSideToggle ? (
              <div className={styles.sideUnder}>
                <button
                  type="button"
                  onClick={() => modal.showProductSide(modalSide === "verso" ? "recto" : "verso")}
                  className={`${styles.sideToggle} ${modalSide === "verso" ? styles.sideToggleOn : ""}`}
                  aria-pressed={modalSide === "verso"}
                >
                  {modalSide === "verso" ? "recto" : "verso"}
                </button>
              </div>
            ) : null}
            {isJersey ? (
              <div className={styles.section}>
                <p className={styles.sectionLabel}>Couleur</p>
                <div className={styles.chipRow}>
                  {JERSEY_COLOR_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => modal.setJerseyColor(option.key)}
                      className={`${styles.jerseyChip} ${jerseyColor === option.key ? styles.jerseyOn : ""}`}
                      aria-pressed={jerseyColor === option.key}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <p className={styles.sizeLabel}>Sélectionnez une taille</p>
            <div className={styles.sizeGrid} style={sizeGridVars}>
              {sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => modal.setSelectedSize(s)}
                  className={`${styles.sizeBtn} ${selectedSize === s ? styles.sizeOn : ""}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {lineVariantProducts.length > 0 || completeLook.length > 0 ? (
            <div className={styles.lookSection}>
              {lineVariantProducts.length > 0 ? (
                <>
                  <p className={`${styles.sectionLabel} ${styles.lookLabel}`}>Coloris du modèle</p>
                  <div className={styles.lookRow}>
                    {lineVariantProducts.map(({ product: variantProduct, variant, isActive }) => (
                      <button
                        key={variant.rectoId}
                        type="button"
                        disabled={variant.comingSoon}
                        onClick={() => {
                          if (isActive) return;
                          modal.switchProductVariant(variantProduct);
                        }}
                        className={`${styles.lookCard} ${isActive ? styles.lookCardActive : ""} ${variant.comingSoon ? styles.lookCardDisabled : ""}`}
                        aria-pressed={isActive}
                      >
                        <DingryProductImage
                          src={variantProduct.image}
                          alt=""
                          width={96}
                          height={128}
                          deliveryWidth={192}
                          className={styles.lookThumb}
                        />
                        <span className={styles.lookCaption}>
                          {variant.colorLabel}
                          {variant.comingSoon ? " · bientôt" : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
              {completeLook.length > 0 ? (
                <>
                  <p
                    className={`${styles.sectionLabel} ${styles.lookLabel} ${lineVariantProducts.length > 0 ? styles.lookLabelSpaced : ""}`}
                  >
                    Complète le look
                  </p>
                  <div className={styles.lookRow}>
                    {completeLook.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => modal.openProductModal(item)}
                        className={styles.lookCard}
                      >
                        <DingryProductImage
                          src={item.image}
                          alt=""
                          width={96}
                          height={128}
                          deliveryWidth={192}
                          className={styles.lookThumb}
                        />
                        <span className={styles.lookCaption}>{storefrontProductTitle(item, products)}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
          <div className={styles.ctaRow}>
            <button
              type="button"
              onClick={(event) => onAddToCart(event.currentTarget)}
              disabled={!selectedSize || cannotPurchase}
              className={`dingry-add-to-cart-btn ${styles.addBtn} ${selectedSize && !cannotPurchase ? styles.addBtnOn : styles.addBtnOff}`}
            >
              {purchaseDisabled
                ? "Catalogue indisponible"
                : outOfStock
                  ? "Épuisé"
                  : "Ajouter au panier"}
            </button>
            <WishlistIconButton
              size="md"
              active={wishlistActive}
              label={wishlistActive ? "Retirer de la wishlist" : "Ajouter à la wishlist"}
              onClick={() => onToggleWishlist(rectoId)}
              className={styles.wishlist}
            />
          </div>
          {showTurnstileProductTest ? <ProductCaptchaTest /> : null}
        </div>
      </motion.div>
    </div>
  );
}
