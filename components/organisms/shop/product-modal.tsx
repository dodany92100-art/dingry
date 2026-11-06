"use client";

import { AnimatePresence, motion } from "motion/react";
import { WishlistIconButton } from "@/components/atoms/wishlist-icon-button";
import { ProductImageFlip } from "@/components/molecules/product-image-flip";
import { isShopProductInStock, type ShopProduct } from "@/lib/catalog";
import { DINGRY_MANIFESTO_EN } from "@/lib/dingry-brand-voice";
import {
  catalogRectoId,
  completeLookForProduct,
  productDetailCopy,
  productLineForShop,
  storefrontProductTitle,
} from "@/lib/dingry-product-display";
import { isJerseyShopProduct, JERSEY_COLOR_OPTIONS } from "@/lib/jersey-shop";
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

type ProductModalProps = {
  modal: ProductModalState;
  products: ShopProduct[];
  flipPairs: FlipPair[];
  wishlistIds: number[];
  onToggleWishlist: (rectoId: number) => void;
  onAddToCart: () => void;
  purchaseDisabled?: boolean;
};

export function ProductModal(props: ProductModalProps) {
  const product = props.modal.selectedProduct;
  return (
    <AnimatePresence>
      {product ? <ProductModalContent key={product.id} product={product} {...props} /> : null}
    </AnimatePresence>
  );
}

type ContentProps = ProductModalProps & { product: ShopProduct };

function ProductModalContent({
  product,
  modal,
  products,
  flipPairs,
  wishlistIds,
  onToggleWishlist,
  onAddToCart,
  purchaseDisabled = false,
}: ContentProps) {
  const { modalSide, jerseyColor, selectedSize, selectedQuantity } = modal;

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
      : { image: displayProduct.image, name: displayProduct.name };

  const flipImages = showSideToggle
    ? activeFlipPair
      ? { front: activeFlipPair.recto.image, back: activeFlipPair.verso.image }
      : teeVersoMeta
        ? { front: product.image, back: IMAGES[teeVersoMeta.image] }
        : null
    : null;

  const productLine = productLineForShop(product.id, products);
  const rectoId = catalogRectoId(product.id);
  const detail = productDetailCopy(product, products);
  const completeLook = completeLookForProduct(product.id, products);
  const wishlistActive = wishlistIds.includes(rectoId);

  const sizes = modalSizesFor(product);
  const sizeCols = sizeGridColumns(sizes);
  const rectoColumn = Math.max(1, sizes.indexOf("S") + 1);
  const nextSide = modalSide === "verso" ? "recto" : "verso";

  const productById = (id: number) => products.find((item) => item.id === id);

  return (
    <div className="dingry-sale fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-12">
      <motion.div
        className="dingry-sale-overlay absolute inset-0 bg-[#050505]/90 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={MODAL_OVERLAY_TRANSITION}
        onClick={() => modal.closeProductModal()}
      />
      <motion.div
        ref={modal.productModalRef}
        data-product-modal=""
        className="dingry-sale-panel relative z-10 bg-[#0a0a0a] border border-white/[0.06] w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row"
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        transition={MODAL_PANEL_SPRING}
      >
        <div
          ref={modal.productImageRef}
          className="dingry-sale-photo w-full shrink-0 overflow-hidden bg-[#080808] md:w-1/2 md:max-w-[520px] md:self-start"
        >
          {flipImages ? (
            <ProductImageFlip
              frontImage={flipImages.front}
              backImage={flipImages.back}
              side={modalSide}
              onSideChange={modal.showProductSide}
              alt={storefrontProductTitle(product, products)}
              imgClassName="brightness-[0.85] contrast-[1.05] grayscale-[0.2]"
            />
          ) : (
            <div className="relative aspect-[3/4] w-full overflow-hidden">
              <img
                src={activeView.image}
                alt={activeView.name}
                width={600}
                height={800}
                className="h-full w-full object-cover"
                style={{ filter: "brightness(0.85) contrast(1.05) grayscale(0.2)" }}
              />
            </div>
          )}
        </div>
        <div className="relative flex flex-1 flex-col justify-between bg-[#0a0a0a] p-6 md:p-10">
          <div>
            <div className="mb-2 flex items-center justify-end gap-3">
              <div className="flex shrink-0 items-center gap-2">
                {showSideToggle ? (
                  <button
                    type="button"
                    onClick={() => modal.showProductSide(modalSide === "verso" ? "recto" : "verso")}
                    className={`border px-3 py-2 text-[10px] tracking-[0.22em] uppercase transition-colors md:hidden ${modalSide === "verso" ? "border-white bg-white text-black" : "border-white/20 text-white/50 hover:border-white/60 hover:text-white"}`}
                    aria-pressed={modalSide === "verso"}
                  >
                    {modalSide === "verso" ? "recto" : "verso"}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => modal.closeProductModal()}
                  className={`h-11 w-11 items-center justify-center text-white/40 transition-colors hover:text-white ${showSideToggle ? "hidden md:flex" : "flex"}`}
                  aria-label="Fermer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="dingry-typo-manifesto-en mb-3">{DINGRY_MANIFESTO_EN}</p>
            <h2 className="mb-2 text-2xl font-bold uppercase tracking-wide leading-tight">
              {storefrontProductTitle(product, products)}
            </h2>
            {detail.description ? (
              <p className="mb-4 text-sm leading-relaxed text-white/55">{detail.description}</p>
            ) : null}
            {detail.fabrication ? (
              <div className="mb-4">
                <p className="mb-1 text-[10px] tracking-[0.28em] text-white/35 uppercase">Fabrication</p>
                <p className="text-xs leading-relaxed text-white/50">{detail.fabrication}</p>
              </div>
            ) : null}
            {detail.limitedEdition ? (
              <div className="mb-4">
                <p className="mb-1 text-[10px] tracking-[0.28em] text-white/35 uppercase">Édition limitée</p>
                <p className="text-xs leading-relaxed text-white/50">{detail.limitedEdition}</p>
              </div>
            ) : null}
            {productLine && productLine.variants.length > 1 ? (
              <div className="mb-6">
                <p className="mb-3 text-[10px] tracking-[0.3em] text-white/40 uppercase">Variantes</p>
                <div className="flex flex-wrap gap-2">
                  {productLine.variants.map((variant) => {
                    const isActive = variant.rectoId === rectoId;
                    const target = productById(variant.rectoId);
                    const disabled = variant.comingSoon || !target;
                    return (
                      <button
                        key={variant.rectoId}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          if (!target || isActive) return;
                          modal.switchProductVariant(target);
                        }}
                        className={`border px-3 py-2 text-[10px] tracking-[0.16em] uppercase transition-colors ${
                          isActive
                            ? "border-[#0066FF] bg-[#0066FF] text-white"
                            : disabled
                              ? "cursor-not-allowed border-white/10 text-white/25"
                              : "border-white/15 text-white/55 hover:border-white/40 hover:text-white"
                        }`}
                        aria-pressed={isActive}
                      >
                        {variant.colorLabel}
                        {variant.comingSoon ? " · bientôt" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {detail.materials ? (
              <div className="mb-4">
                <p className="mb-1 text-[10px] tracking-[0.28em] text-white/35 uppercase">Matières</p>
                <p className="text-xs leading-relaxed text-white/50">{detail.materials}</p>
              </div>
            ) : null}
            {detail.sizeGuide ? (
              <div className="mb-6">
                <p className="mb-1 text-[10px] tracking-[0.28em] text-white/35 uppercase">Guide des tailles</p>
                <p className="text-xs leading-relaxed text-white/50">{detail.sizeGuide}</p>
              </div>
            ) : null}
            <div className="mb-6 flex items-start justify-between gap-3">
              <span className="text-[10px] tracking-[0.3em] text-white/40 uppercase">Quantité</span>
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center border border-white/15">
                  <button
                    type="button"
                    onClick={() => modal.setSelectedQuantity((quantity) => Math.max(1, quantity - 1))}
                    aria-label="Diminuer la quantité"
                    className="w-9 h-9 text-white/60 hover:bg-white hover:text-black transition-colors"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-medium" aria-live="polite">
                    {selectedQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => modal.setSelectedQuantity((quantity) => Math.min(99, quantity + 1))}
                    aria-label="Augmenter la quantité"
                    className="w-9 h-9 text-white/60 hover:bg-white hover:text-black transition-colors"
                  >
                    +
                  </button>
                </div>
                <p className="text-2xl font-bold tabular-nums tracking-tight text-[#0066FF]">
                  {saleProduct.price * selectedQuantity}€
                </p>
              </div>
            </div>
            {isJersey ? (
              <div className="mb-6">
                <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase mb-3">Couleur</p>
                <div className="flex flex-wrap gap-2">
                  {JERSEY_COLOR_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => modal.setJerseyColor(option.key)}
                      className={`border px-4 py-2.5 text-[10px] tracking-[0.22em] uppercase transition-colors ${
                        jerseyColor === option.key
                          ? "border-white bg-white text-black"
                          : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
                      }`}
                      aria-pressed={jerseyColor === option.key}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase mb-4">Sélectionnez une taille</p>
            <div
              className={`grid gap-2 ${showSideToggle ? "mb-2" : "mb-8"} ${sizeCols === 4 ? "grid-cols-4" : "grid-cols-6"}`}
            >
              {sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => modal.setSelectedSize(s)}
                  className={`py-2.5 text-xs font-medium tracking-widest border transition-colors duration-150 ${
                    selectedSize === s
                      ? "bg-[#0066FF] border-[#0066FF] text-white"
                      : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {showSideToggle ? (
              <div
                className="mb-8 hidden gap-2 md:grid"
                style={{ gridTemplateColumns: `repeat(${sizeCols}, minmax(0, 1fr))` }}
              >
                <button
                  type="button"
                  onClick={() => modal.showProductSide(nextSide)}
                  aria-pressed={modalSide === "verso"}
                  style={{ gridColumn: rectoColumn }}
                  className={`py-2.5 text-[10px] font-medium tracking-[0.18em] uppercase border transition-colors duration-150 ${
                    modalSide === "verso"
                      ? "border-white bg-white text-black"
                      : "border-white/20 text-white/50 hover:border-white/60 hover:text-white"
                  }`}
                >
                  {nextSide}
                </button>
              </div>
            ) : null}
          </div>
          {completeLook.length > 0 ? (
            <div className="mb-6 border-t border-white/[0.06] pt-5">
              <p className="mb-3 text-[10px] tracking-[0.28em] text-[#0066FF] uppercase">Complète le look</p>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {completeLook.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => modal.openProductModal(item)}
                    className="w-24 shrink-0 border border-white/10 bg-[#080808] text-left transition-colors hover:border-[#0066FF]/40"
                  >
                    <img src={item.image} alt="" className="aspect-[3/4] w-full object-cover" />
                    <span className="block p-2 text-[9px] uppercase leading-snug tracking-wide text-white/55">
                      {storefrontProductTitle(item)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div className="flex items-stretch gap-2">
            <button
              type="button"
              onClick={onAddToCart}
              disabled={!selectedSize || cannotPurchase}
              className={`dingry-add-to-cart-btn min-h-[52px] flex-1 py-4 text-xs font-bold tracking-[0.3em] uppercase transition-colors duration-200 ${
                selectedSize && !cannotPurchase
                  ? "bg-[#0066FF] text-white shadow-[0_8px_32px_rgba(0,102,255,0.35)] hover:bg-[#0052cc]"
                  : "bg-white/10 text-white/20 cursor-not-allowed"
              }`}
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
              className="shrink-0 self-auto"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
