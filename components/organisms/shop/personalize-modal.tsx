"use client";

import { useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { isShopProductInStock, type ShopProduct } from "@/lib/catalog";
import { PERSONALIZATION_SURCHARGE_EUR } from "@/lib/checkout-draft";
import { DINGRY_MANIFESTO_FR } from "@/lib/dingry-brand-voice";
import {
  PERSONALIZATION_MAX_LABEL_LENGTH,
  PERSONALIZATION_SHIRTS,
  SIZES,
  type PersonalizationShirtId,
} from "@/lib/shop-data";
import {
  clampPersonalizationLabel,
  personalizationLine,
  personalizationPreviewLabel,
} from "@/lib/shop-view";
import { MODAL_OVERLAY_TRANSITION, MODAL_PANEL_SPRING } from "./motion";
import modalStyles from "./product-modal.module.css";
import styles from "./personalize-modal.module.css";

export type PersonalizedLineInput = { size: string; qty: number; personalization: string };

type PersonalizeModalProps = {
  open: boolean;
  product: ShopProduct | undefined;
  onClose: () => void;
  onSubmit: (line: PersonalizedLineInput) => void;
};

/** Formulaire conservé entre ouvertures (état local React). */
export function PersonalizeModal({ open, product, onClose, onSubmit }: PersonalizeModalProps) {
  const [label, setLabel] = useState("PARIS");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [shirtId, setShirtId] = useState<PersonalizationShirtId>("noir");

  const shirt = PERSONALIZATION_SHIRTS.find((s) => s.id === shirtId) ?? PERSONALIZATION_SHIRTS[0];
  const previewLabel = personalizationPreviewLabel(label);
  const inStock = product ? isShopProductInStock(product) : false;
  const canSubmit = Boolean(size) && Boolean(label.trim()) && inStock;
  const unitPrice = (product?.price ?? 0) + PERSONALIZATION_SURCHARGE_EUR;
  const sizeGridVars = { "--size-cols": "6" } as CSSProperties;

  function handleAdd() {
    if (!product || !size || !isShopProductInStock(product)) return;
    const line = personalizationLine(label, shirt.label);
    if (!line) return;
    onSubmit({ size, qty, personalization: line });
  }

  return (
    <AnimatePresence>
      {open ? (
        <div key="dingry-personalize-modal" data-dingry-personalize-modal="" className={modalStyles.root}>
          <motion.div
            className={modalStyles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MODAL_OVERLAY_TRANSITION}
            onClick={onClose}
          />
          <motion.div
            className={`${modalStyles.panel} dingry-sale-ui`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={MODAL_PANEL_SPRING}
          >
            <div className={modalStyles.photo}>
              <div className={styles.previewStage}>
                <img
                  src={shirt.image}
                  alt={`Tee ${shirt.label} — vue recto`}
                  className="h-full w-full object-cover"
                  style={{ filter: "brightness(0.92) contrast(1.05)" }}
                />
                <div
                  className="dingry-personalize-city pointer-events-none absolute left-1/2 -translate-x-1/2 text-center uppercase"
                  style={{ top: shirt.cityTop, width: "78%", fontSize: shirt.citySize }}
                  aria-live="polite"
                >
                  {previewLabel}
                </div>
                <p className={styles.previewCaptionTop}>Vue recto — sous le logo</p>
                <p className={styles.previewCaptionBottom}>Simulation indicative</p>
              </div>
            </div>

            <div className={modalStyles.body}>
              <div>
                <div className={modalStyles.toolbar}>
                  <button type="button" onClick={onClose} className={modalStyles.close} aria-label="Fermer">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <p className={`dingry-typo-manifesto ${modalStyles.manifesto}`}>{DINGRY_MANIFESTO_FR}</p>
                <p className={styles.eyebrow}>Custom · Studio</p>
                <h2 className={modalStyles.title}>Configurateur tee personnalisé</h2>
                <p className={modalStyles.description}>
                  Choisissez la couleur, saisissez votre texte, vérifiez l&apos;aperçu recto, puis ajoutez au panier.
                </p>
                <ol className={styles.steps}>
                  <li className={styles.stepPill}>1 · Couleur</li>
                  <li className={styles.stepPill}>2 · Texte</li>
                  <li className={styles.stepPill}>3 · Taille & quantité</li>
                </ol>

                <div className={modalStyles.section}>
                  <p className={modalStyles.metaText}>
                    Choisis ta ville et personnalise ton DINGRY. Personnalisation possible,{" "}
                    <span className="dingry-product-price dingry-product-price--sm inline-block align-baseline">
                      {PERSONALIZATION_SURCHARGE_EUR}€
                    </span>{" "}
                    par article.
                  </p>
                </div>

                <div className={modalStyles.section}>
                  <p className={modalStyles.sectionLabel}>Étape 1 · Couleur du tee</p>
                  <div className={modalStyles.chipRow}>
                    {PERSONALIZATION_SHIRTS.map((option) => {
                      const active = shirtId === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setShirtId(option.id)}
                          className={`${modalStyles.chip} ${active ? styles.colorChipActive : ""}`}
                          style={
                            active
                              ? ({
                                  "--shirt-swatch": option.swatch,
                                  "--shirt-swatch-text": option.swatchText,
                                } as CSSProperties)
                              : undefined
                          }
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className={`${modalStyles.section} block`}>
                  <span className={modalStyles.sectionLabel}>Étape 2 · Ville, pays ou texte</span>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(clampPersonalizationLabel(e.target.value))}
                    placeholder="Ville, Pays"
                    className={styles.fieldInput}
                    maxLength={PERSONALIZATION_MAX_LABEL_LENGTH}
                  />
                </label>

                <div className={modalStyles.section}>
                  <p className={modalStyles.sizeLabel}>Étape 3 · Taille</p>
                  <div className={`${modalStyles.sizeGrid} ${modalStyles.sizeGridTight}`} style={sizeGridVars}>
                    {SIZES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        className={`${modalStyles.sizeBtn} ${size === s ? modalStyles.sizeOn : ""}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className={modalStyles.qtyRow}>
                  <div className={modalStyles.qtyLead}>
                    <span className={modalStyles.qtyLabel}>Quantité</span>
                    <p className={modalStyles.qtyPrice}>{unitPrice * qty}€</p>
                    <p className={styles.priceMeta}>
                      ({unitPrice}€ × {qty})
                    </p>
                  </div>
                  <div className={modalStyles.qtyControl}>
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className={modalStyles.qtyBtn}
                      aria-label="Diminuer la quantité"
                    >
                      −
                    </button>
                    <span className={modalStyles.qtyValue}>{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.min(99, q + 1))}
                      className={modalStyles.qtyBtn}
                      aria-label="Augmenter la quantité"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!canSubmit}
                  className={`${modalStyles.addBtn} ${canSubmit ? modalStyles.addBtnOn : modalStyles.addBtnOff}`}
                >
                  {product && !inStock ? "Épuisé" : "Ajouter au panier"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
