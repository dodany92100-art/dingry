"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { isShopProductInStock, type ShopProduct } from "@/lib/catalog";
import { PERSONALIZATION_SURCHARGE_EUR } from "@/lib/checkout-draft";
import {
  enabledAtelierModels,
  formatCitySizeClamp,
  fallbackAtelierCityColorForModel,
  isAtelierCityColorAllowedForModel,
  normalizeAtelierCityColor,
  ATELIER_CUSTOM_SIZES,
  parseCitySizeMaxRem,
  resolveAtelierCityTextStyle,
  resolvePersonalizationShopProduct,
  type ShopAtelierCustomConfig,
} from "@/lib/atelier-custom-config";
import { AtelierCityColorControl } from "@/components/molecules/shop/atelier-city-color-control";
import { AtelierCitySizeSlider } from "@/components/molecules/shop/atelier-city-size-slider";
import { AtelierCityTopSlider } from "@/components/molecules/shop/atelier-city-top-slider";
import { PersonalizePreviewStage } from "@/components/molecules/shop/personalize-preview-stage";
import { PersonalizePreviewZoom } from "@/components/molecules/shop/personalize-preview-zoom";
import { DEFAULT_ATELIER_CONFIGURATOR_LABEL } from "@/lib/custom-city-banner";
import { PERSONALIZATION_MAX_LABEL_LENGTH, PRODUCTS } from "@/lib/shop-data";
import {
  clampPersonalizationLabel,
  formatPersonalizationForCart,
  personalizationPreviewLabel,
} from "@/lib/shop-view";
import { DingryLogo } from "@/components/atoms/dingry-logo";
import { MODAL_OVERLAY_TRANSITION, MODAL_PANEL_SPRING } from "./motion";
import modalStyles from "./product-modal.module.css";
import {
  PERSONALIZE_STEPS,
  PersonalizeStepPane,
  PersonalizeStepTabs,
  type PersonalizeStep,
} from "./personalize-modal-steps";
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
  bannerSeedLabel?: string | null;
  onBannerSeedConsumed?: () => void;
  onClose: () => void;
  onSubmit: (line: PersonalizedLineInput) => void;
};

/** Formulaire conservé entre ouvertures (état local React). */
export function PersonalizeModal({
  open,
  products,
  atelierConfig,
  fallbackProduct,
  bannerSeedLabel,
  onBannerSeedConsumed,
  onClose,
  onSubmit,
}: PersonalizeModalProps) {
  const models = useMemo(() => enabledAtelierModels(atelierConfig), [atelierConfig]);
  const [label, setLabel] = useState("");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [modelId, setModelId] = useState("");
  const [cityTopTune, setCityTopTune] = useState<string | null>(null);
  const [cityColorTune, setCityColorTune] = useState<string | null>(null);
  const [citySizeTune, setCitySizeTune] = useState<string | null>(null);
  const [step, setStep] = useState<PersonalizeStep>("model");
  const [previewZoomOpen, setPreviewZoomOpen] = useState(false);
  const [mobileStepMount, setMobileStepMount] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false,
  );

  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setMobileStepMount(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [open]);

  useEffect(() => {
    if (open) setStep("model");
  }, [open]);

  useEffect(() => {
    if (!open) setPreviewZoomOpen(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (models.length === 0) return;
    setModelId((prev) => (models.some((m) => m.id === prev) ? prev : models[0]!.id));
  }, [open, models]);

  useEffect(() => {
    if (!open || !bannerSeedLabel?.trim()) return;
    setLabel(clampPersonalizationLabel(bannerSeedLabel));
    onBannerSeedConsumed?.();
  }, [bannerSeedLabel, onBannerSeedConsumed, open]);

  useEffect(() => {
    if (!open || bannerSeedLabel?.trim()) return;
    setLabel((prev) =>
      prev.trim() ? prev : clampPersonalizationLabel(DEFAULT_ATELIER_CONFIGURATOR_LABEL),
    );
  }, [open, bannerSeedLabel]);

  const model = models.find((m) => m.id === modelId) ?? models[0];

  useEffect(() => {
    if (!model) return;
    setCityTopTune(model.cityTop);
    const fromModel = normalizeAtelierCityColor(model.previewCityColor);
    setCityColorTune(
      fromModel && isAtelierCityColorAllowedForModel(model.id, fromModel)
        ? fromModel
        : fallbackAtelierCityColorForModel(model.id),
    );
    setCitySizeTune(model.citySize);
  }, [model?.cityTop, model?.citySize, model?.id, model?.previewCityColor]);

  useEffect(() => {
    if (!model || cityColorTune === null) return;
    const current = normalizeAtelierCityColor(cityColorTune);
    if (current && !isAtelierCityColorAllowedForModel(model.id, current)) {
      setCityColorTune(fallbackAtelierCityColorForModel(model.id));
    }
  }, [cityColorTune, model]);

  const previewCityTop = cityTopTune ?? model?.cityTop ?? "44%";
  const previewCityColor = cityColorTune ?? model?.previewCityColor ?? "";
  const previewCitySize = citySizeTune ?? model?.citySize ?? formatCitySizeClamp(0.5);
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
  const cityPresentation = model
    ? resolveAtelierCityTextStyle(model, previewCityColor)
    : { className: "dingry-personalize-city", style: {} as CSSProperties };

  const sizeOptions = model?.sizes.length ? model.sizes : [];
  const sizeGridVars = { "--size-cols": String(sizeOptions.length || ATELIER_CUSTOM_SIZES.length) } as CSSProperties;

  const previewTuningDirty = Boolean(
    model &&
      (previewCityTop !== model.cityTop ||
        normalizeAtelierCityColor(previewCityColor) !== normalizeAtelierCityColor(model.previewCityColor) ||
        previewCitySize !== model.citySize),
  );

  function resetPreviewTuning() {
    if (!model) return;
    setCityTopTune(model.cityTop);
    setCityColorTune(model.previewCityColor);
    setCitySizeTune(model.citySize);
  }

  function handleAdd() {
    if (!model || !saleProduct || !size || !isShopProductInStock(saleProduct)) return;
    const shirtLabel = `${model.label} ${model.catalogRef}`.trim();
    const color =
      normalizeAtelierCityColor(previewCityColor) ||
      normalizeAtelierCityColor(model.previewCityColor);
    const line = formatPersonalizationForCart(label, shirtLabel, {
      cityColor: color || undefined,
      citySizeRem: parseCitySizeMaxRem(previewCitySize),
    });
    if (!line) return;
    onSubmit({
      size,
      qty,
      personalization: line,
      productId: model.productId,
      modelId: model.id,
    });
  }

  const mobileStepTitle = PERSONALIZE_STEPS.find((entry) => entry.id === step)?.title ?? "Atelier custom";
  const addBtnClass = `${modalStyles.addBtn} dingry-add-to-cart-btn w-full ${canSubmit ? modalStyles.addBtnOn : modalStyles.addBtnOff}`;
  const addLabel = saleProduct && !inStock ? "Épuisé" : "Ajouter au panier";

  const advancedTuneBlock = model ? (
    <details className={styles.advancedTune} open>
      <summary>Réglages avancés</summary>
      <div className={styles.advancedTuneBody}>
        <AtelierCitySizeSlider
          id="personalize-city-size"
          citySize={previewCitySize}
          onChange={setCitySizeTune}
          className="mt-2"
          tone="light"
        />
        <AtelierCityTopSlider
          id="personalize-city-top"
          value={previewCityTop}
          onChange={setCityTopTune}
          className="mt-3"
          tone="light"
        />
        <button
          type="button"
          onClick={resetPreviewTuning}
          disabled={!previewTuningDirty}
          className={styles.previewTuneReset}
        >
          Réinitialiser les réglages
        </button>
      </div>
    </details>
  ) : null;

  const modelChipRow =
    models.length === 0 ? (
      <p className="text-sm text-neutral-500">Atelier temporairement indisponible.</p>
    ) : (
      <div className={`${modalStyles.chipRow} ${styles.sheetChipRow}`}>
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
              className={`${modalStyles.chip} ${styles.modelChip} ${
                active
                  ? option.id === "tee-blanc"
                    ? styles.modelChipWhiteOn
                    : option.id === "tee-noir"
                      ? styles.modelChipBlackOn
                      : styles.colorChipActive
                  : ""
              }`}
              style={
                active && option.id !== "tee-blanc" && option.id !== "tee-noir"
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
    );

  const cityChipRow =
    atelierConfig.suggestedCities.length > 0 ? (
      <div className={`${modalStyles.chipRow} ${styles.cityChipRow} ${styles.sheetChipRow}`}>
        {atelierConfig.suggestedCities.map((city) => {
          const active = personalizationPreviewLabel(label) === personalizationPreviewLabel(city);
          return (
            <button
              key={city}
              type="button"
              onClick={() => setLabel(clampPersonalizationLabel(city))}
              onPointerDown={(event) => {
                if (event.pointerType === "touch") setLabel(clampPersonalizationLabel(city));
              }}
              className={`${modalStyles.chip} ${styles.cityChip} ${active ? styles.cityChipActive : ""}`}
              aria-pressed={active}
            >
              {city}
            </button>
          );
        })}
      </div>
    ) : null;

  const labelField = (
    <label className={`block ${styles.fieldInputWrap}`}>
      <span className={styles.fieldInputLabel}>Texte personnalisé</span>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(clampPersonalizationLabel(e.target.value))}
        placeholder="Ville, pays ou texte libre"
        className={styles.fieldInput}
        aria-label="Texte personnalisé"
        maxLength={PERSONALIZATION_MAX_LABEL_LENGTH}
        autoComplete="off"
      />
    </label>
  );

  const modelTextDesktopSection = (
    <div className={`${modalStyles.section} ${styles.sheetStepSection} ${styles.sheetDesktopModelText}`}>
      <p className={`${modalStyles.sectionLabel} ${styles.sheetDesktopGroupTitle}`}>Modèle &amp; texte</p>
      <div className={styles.sheetDesktopChipRow}>
        {modelChipRow}
        {cityChipRow ? <span className={styles.sheetDesktopChipDivider} aria-hidden /> : null}
        {cityChipRow}
      </div>
      {labelField}
    </div>
  );

  const modelSection = (
    <div className={`${modalStyles.section} ${styles.sheetStepSection}`}>
      <p className={`${modalStyles.sectionLabel} ${styles.mobileOnlyBlock}`}>1 — Modèle</p>
      {modelChipRow}
    </div>
  );

  const textSection = (
    <div className={`${modalStyles.section} ${styles.sheetStepSection}`}>
      <p className={`${modalStyles.sectionLabel} ${styles.mobileOnlyBlock}`}>2 — Texte</p>
      {cityChipRow}
      <div className="mt-3">{labelField}</div>
    </div>
  );

  const sizeSection = (
    <div className={`${modalStyles.section} ${styles.sheetStepSection}`}>
      <p className={`${modalStyles.sizeLabel} ${styles.desktopOnlyBlock}`}>3 — Taille &amp; quantité</p>
      <div className={`${modalStyles.sizeGrid} ${modalStyles.sizeGridTight} ${styles.sheetSizeGrid}`} style={sizeGridVars}>
        {sizeOptions.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={size === s}
            onClick={() => setSize(s)}
            onPointerDown={(event) => {
              if (event.pointerType === "touch") setSize(s);
            }}
            className={`${modalStyles.sizeBtn} ${size === s ? modalStyles.sizeOn : ""}`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className={`${modalStyles.qtyRow} ${styles.qtyRowSpaced} ${styles.mobileOnlyBlock}`}>
        <div className={modalStyles.qtyLead}>
          <span className={modalStyles.qtyLabel}>Quantité</span>
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
    </div>
  );

  return (
    <>
    <AnimatePresence>
      {open ? (
        <div
          key="dingry-personalize-modal"
          data-dingry-personalize-modal=""
          className={`${modalStyles.root} ${styles.sheetRoot}`}
        >
          <motion.div
            className={modalStyles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MODAL_OVERLAY_TRANSITION}
            onClick={onClose}
          />
          <motion.div
            className={`${modalStyles.panel} ${styles.sheetPanel} dingry-sale-ui`}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={MODAL_PANEL_SPRING}
            role="dialog"
            aria-modal="true"
            aria-label="Configurateur atelier"
          >
            <header className={`${styles.sheetHeader} ${styles.mobileOnlyBlock}`}>
              <p className={styles.sheetHeaderTitle}>{mobileStepTitle}</p>
              <button type="button" onClick={onClose} className={styles.sheetHeaderClose} aria-label="Fermer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <div className={styles.sheetChrome}>
              <div className={styles.sheetScroll}>
                <div className={`${modalStyles.photo} ${styles.sheetPhoto}`}>
              {model ? (
                <PersonalizePreviewStage
                  model={model}
                  imageUrl={model.previewImageUrl}
                  previewLabel={previewLabel}
                  previewCityTop={previewCityTop}
                  previewCitySize={previewCitySize}
                  cityClassName={cityPresentation.className}
                  cityStyle={cityPresentation.style}
                  rootClassName={styles.sheetPreviewStage}
                  onOpenZoom={() => setPreviewZoomOpen(true)}
                />
              ) : null}
              {model ? (
                <div className={styles.cityTopSlider}>
                  <AtelierCityColorControl
                    id="personalize-city-color"
                    value={previewCityColor}
                    onChange={setCityColorTune}
                    modelId={model.id}
                    tone="light"
                    centered={mobileStepMount}
                    className={styles.cityColorControl}
                  />
                  <div className={styles.photoAdvancedTune}>{advancedTuneBlock}</div>
                </div>
              ) : null}
                </div>

                <div className={`${modalStyles.body} ${styles.sheetBodyMobile}`}>
                  <div className={styles.sheetBodyInner}>
                    {!mobileStepMount ? (
                      <div className={`${styles.desktopOnlyBlock} ${styles.sheetDesktopIntro}`}>
                        <div className={styles.sheetDesktopIntroHead}>
                          <DingryLogo
                            animate={false}
                            tone="on-light"
                            className={`${styles.sheetDesktopLogo} h-6 w-auto`}
                          />
                          <button
                            type="button"
                            onClick={onClose}
                            className={`${modalStyles.close} ${styles.sheetDesktopClose}`}
                            aria-label="Fermer"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                        <h2 className={`${modalStyles.title} ${styles.sheetDesktopTitle}`}>
                          Configurateur T-shirt custom
                        </h2>
                        <p className={`${modalStyles.description} ${styles.sheetDesktopDescription}`}>
                          Tee blanc ou noir, texte, taille, puis panier.
                        </p>
                      </div>
                    ) : null}

                    <PersonalizeStepTabs active={step} onChange={setStep} />
                    {!mobileStepMount ? modelTextDesktopSection : null}
                    {mobileStepMount ? (
                      <>
                        <PersonalizeStepPane step="model" active={step} mountActiveOnly>
                          {modelSection}
                        </PersonalizeStepPane>
                        <PersonalizeStepPane step="text" active={step} mountActiveOnly>
                          {textSection}
                        </PersonalizeStepPane>
                      </>
                    ) : null}
                    <PersonalizeStepPane step="size" active={step} mountActiveOnly={mobileStepMount}>
                      {sizeSection}
                    </PersonalizeStepPane>
                  </div>

                  {!mobileStepMount ? (
                  <div className={`${styles.desktopOnlyBlock} ${styles.sheetDesktopCta}`}>
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
                    <button type="button" onClick={handleAdd} disabled={!canSubmit} className={addBtnClass}>
                      {addLabel}
                    </button>
                  </div>
                  ) : null}
                </div>
              </div>
            </div>

            <footer className={`${styles.sheetFooter} ${styles.mobileOnlyBlock}`}>
              <div className={styles.sheetFooterMeta}>
                <span>Total</span>
                <span className={styles.sheetFooterPrice}>{unitPrice * qty}€</span>
              </div>
              <button type="button" onClick={handleAdd} disabled={!canSubmit} className={addBtnClass}>
                {addLabel}
              </button>
            </footer>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
    {model ? (
      <PersonalizePreviewZoom
        open={previewZoomOpen}
        onClose={() => setPreviewZoomOpen(false)}
        model={model}
        previewLabel={previewLabel}
        previewCityTop={previewCityTop}
        previewCitySize={previewCitySize}
        cityClassName={cityPresentation.className}
        cityStyle={cityPresentation.style}
      />
    ) : null}
    </>
  );
}
