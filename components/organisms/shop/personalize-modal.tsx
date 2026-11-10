"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { isShopProductInStock, type ShopProduct } from "@/lib/catalog";
import { PERSONALIZATION_SURCHARGE_EUR } from "@/lib/checkout-draft";
import { DINGRY_MANIFESTO_FR } from "@/lib/dingry-brand-voice";
import {
  enabledAtelierModels,
  previewTextStyleClass,
  resolvePersonalizationShopProduct,
  type ShopAtelierCustomConfig,
} from "@/lib/atelier-custom-config";
import { PERSONALIZATION_MAX_LABEL_LENGTH, PRODUCTS } from "@/lib/shop-data";
import {
  clampPersonalizationLabel,
  personalizationLine,
  personalizationPreviewLabel,
} from "@/lib/shop-view";
import { DingryLogo } from "@/components/atoms/dingry-logo";
import { MODAL_OVERLAY_TRANSITION, MODAL_PANEL_SPRING } from "./motion";
import modalStyles from "./product-modal.module.css";
import styles from "./personalize-modal.module.css";

export type PersonalizedLineInput = {
  size: string;
  qty: number;
  personalization: string;
  productId: number;
  modelId: string;
};

type PersonalizeModalProps = {
  open: boolean;
  products: readonly ShopProduct[];
  atelierConfig: ShopAtelierCustomConfig;
  fallbackProduct?: ShopProduct;
  onClose: () => void;
  onSubmit: (line: PersonalizedLineInput) => void;
};

/** Formulaire conservé entre ouvertures (état local React). */
export function PersonalizeModal({
  open,
  products,
  atelierConfig,
  fallbackProduct,
  onClose,
  onSubmit,
}: PersonalizeModalProps) {
  const models = useMemo(() => enabledAtelierModels(atelierConfig), [atelierConfig]);
  const [label, setLabel] = useState("");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [modelId, setModelId] = useState("");

  useEffect(() => {
    if (!open) return;
    if (models.length === 0) return;
    setModelId((prev) => (models.some((m) => m.id === prev) ? prev : models[0]!.id));
  }, [open, models]);

  const model = models.find((m) => m.id === modelId) ?? models[0];
  const saleProduct = useMemo(() => {
    if (!model) return fallbackProduct;
    return (
      resolvePersonalizationShopProduct(products, model, PRODUCTS) ??
      fallbackProduct
    );
  }, [fallbackProduct, model, products]);

  const previewLabel = label.trim() ? personalizationPreviewLabel(label) : "";
  const inStock = saleProduct ? isShopProductInStock(saleProduct) : false;
  const canSubmit = Boolean(model) && Boolean(size) && Boolean(label.trim()) && inStock;
  const unitPrice = (saleProduct?.price ?? 0) + PERSONALIZATION_SURCHARGE_EUR;
  const sizeGridVars = { "--size-cols": "6" } as CSSProperties;
  const cityClass = model ? previewTextStyleClass(model.previewTextStyle) : "dingry-personalize-city";

  const sizeOptions = model?.sizes.length ? model.sizes : [];

  function handleAdd() {
    if (!model || !saleProduct || !size || !isShopProductInStock(saleProduct)) return;
    const line = personalizationLine(label, `${model.label} ${model.catalogRef}`.trim());
    if (!line) return;
    onSubmit({
      size,
      qty,
      personalization: line,
      productId: model.productId,
      modelId: model.id,
    });
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
                {model ? (
                  <img
                    src={model.previewImageUrl}
                    alt={`${model.label} — vue recto`}
                    className="h-full w-full object-cover"
                    style={{ filter: "brightness(0.92) contrast(1.05)" }}
                  />
                ) : null}
                {previewLabel && model ? (
                  <div
                    className={`${cityClass} pointer-events-none absolute left-1/2 -translate-x-1/2 text-center uppercase`}
                    style={{ top: model.cityTop, width: "78%", fontSize: model.citySize }}
                    aria-live="polite"
                  >
                    {previewLabel}
                  </div>
                ) : null}
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
                <DingryLogo animate={false} tone="on-light" className="mb-4 h-9 w-auto md:h-10" />
                <p className={`dingry-typo-manifesto ${modalStyles.manifesto}`}>{DINGRY_MANIFESTO_FR}</p>
                <p className={styles.eyebrow}>Atelier custom</p>
                <h2 className={modalStyles.title}>Configurateur T-shirt personnalisé</h2>
                <p className={modalStyles.description}>
                  Choisis le modèle ({models.map((m) => m.catalogRef).join(" ou ")}), ton texte, la taille, puis
                  ajoute au panier.
                </p>
                <ol className={styles.steps}>
                  <li className={styles.stepPill}>1 — Modèle</li>
                  <li className={styles.stepPill}>2 — Texte</li>
                  <li className={styles.stepPill}>3 — Taille &amp; Quantité</li>
                </ol>

                {models.length === 0 ? (
                  <p className="text-sm text-neutral-500">Atelier temporairement indisponible.</p>
                ) : (
                  <div className={modalStyles.section}>
                    <p className={modalStyles.sectionLabel}>1 — Modèle</p>
                    <div className={modalStyles.chipRow}>
                      {models.map((option) => {
                        const active = model?.id === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                              setModelId(option.id);
                              if (size && !option.sizes.includes(size)) setSize("");
                            }}
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
                            {option.label} {option.catalogRef}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <label className={`${modalStyles.section} block`}>
                  <span className={modalStyles.sectionLabel}>2 — Texte</span>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(clampPersonalizationLabel(e.target.value))}
                    placeholder="Ville, Pays"
                    className={styles.fieldInput}
                    maxLength={PERSONALIZATION_MAX_LABEL_LENGTH}
                    list={atelierConfig.suggestedCities.length ? "dingry-atelier-cities" : undefined}
                  />
                  {atelierConfig.suggestedCities.length > 0 ? (
                    <datalist id="dingry-atelier-cities">
                      {atelierConfig.suggestedCities.map((city) => (
                        <option key={city} value={city} />
                      ))}
                    </datalist>
                  ) : null}
                </label>

                <div className={modalStyles.section}>
                  <p className={modalStyles.sizeLabel}>3 — Taille &amp; quantité</p>
                  <div className={`${modalStyles.sizeGrid} ${modalStyles.sizeGridTight}`} style={sizeGridVars}>
                    {sizeOptions.map((s) => (
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
                <div className={`${modalStyles.qtyRow} ${styles.qtyRowSpaced}`}>
                  <div className={modalStyles.qtyLead}>
                    <span className={modalStyles.qtyLabel}>Quantité</span>
                    <p className={modalStyles.qtyPrice}>{unitPrice * qty}€</p>
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
                  className={`${modalStyles.addBtn} dingry-add-to-cart-btn ${canSubmit ? modalStyles.addBtnOn : modalStyles.addBtnOff}`}
                >
                  {saleProduct && !inStock ? "Épuisé" : "Ajouter au panier"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
