"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { isShopProductInStock, type ShopProduct } from "@/lib/catalog";
import { PERSONALIZATION_SURCHARGE_EUR } from "@/lib/checkout-draft";
import {
  atelierModelPickerGroupForProduct,
  enabledAtelierModels,
  findAtelierModelForProduct,
  formatCitySizeClamp,
  type AtelierCustomModel,
  type AtelierModelPickerGroupId,
  fallbackAtelierCityColorForModel,
  isAtelierCityColorAllowedForModel,
  normalizeAtelierCityColor,
  ATELIER_CUSTOM_SIZES,
  parseCitySizeMaxRem,
  resolveAtelierCityTextStyle,
  resolvePersonalizationShopProduct,
  type ShopAtelierCustomConfig,
} from "@/lib/atelier-custom-config";
import { AtelierModelPicker } from "@/components/molecules/shop/atelier-model-picker";
import { PersonalizePreviewStage } from "@/components/molecules/shop/personalize-preview-stage";
import { PersonalizePreviewZoom } from "@/components/molecules/shop/personalize-preview-zoom";
import { PERSONALIZATION_MAX_LABEL_LENGTH, PRODUCTS } from "@/lib/shop-data";
import {
  clampPersonalizationLabel,
  formatPersonalizationForCart,
  formatPersonalizationSansVille,
  personalizationPreviewLabel,
} from "@/lib/shop-view";
import { MODAL_OVERLAY_TRANSITION, MODAL_PANEL_SPRING } from "./motion";
import modalStyles from "./product-modal.module.css";
import {
  PERSONALIZE_STEPS,
  PersonalizeStepPane,
  PersonalizeStepSection,
  PersonalizeStepTabs,
  nextPersonalizeStep,
  personalizeStepHeading,
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
  initialProductId?: number | null;
  initialSize?: string | null;
  initialModelGroup?: AtelierModelPickerGroupId | null;
  onProductSeedConsumed?: () => void;
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
  initialProductId,
  initialSize,
  initialModelGroup,
  onProductSeedConsumed,
  onClose,
  onSubmit,
}: PersonalizeModalProps) {
  const models = useMemo(() => {
    const all = enabledAtelierModels(atelierConfig);
    if (!initialModelGroup) return all;
    return all.filter((entry) => atelierModelPickerGroupForProduct(entry.productId) === initialModelGroup);
  }, [atelierConfig, initialModelGroup]);
  const [label, setLabel] = useState("");
  const [sansVille, setSansVille] = useState(false);
  const [size, setSize] = useState("");
  const [surchargeAccepted, setSurchargeAccepted] = useState(false);
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

  const sheetScrollRef = useRef<HTMLDivElement>(null);
  const sheetBodyInnerRef = useRef<HTMLDivElement>(null);
  const validateActionsRef = useRef<HTMLDivElement>(null);
  const stepSectionRefs = useRef<Partial<Record<PersonalizeStep, HTMLElement | null>>>({});
  const scrollStepRafRef = useRef<number | null>(null);
  const stepAdvanceCooldownRef = useRef(false);
  const skipStepScrollOnOpenRef = useRef(false);
  const textAutoAdvancedRef = useRef(false);

  const registerStepSectionRef = useCallback((targetStep: PersonalizeStep, el: HTMLElement | null) => {
    stepSectionRefs.current[targetStep] = el;
  }, []);

  const scrollToPersonalizeStep = useCallback(
    (targetStep: PersonalizeStep) => {
      if (typeof window === "undefined") return;

      const run = () => {
        const target = stepSectionRefs.current[targetStep];
        if (!target) return;

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const behavior: ScrollBehavior = reducedMotion ? "auto" : "smooth";
        const scrollRoot = mobileStepMount ? sheetScrollRef.current : sheetBodyInnerRef.current;

        if (scrollRoot && !mobileStepMount) {
          const rootTop = scrollRoot.getBoundingClientRect().top;
          const targetTop = target.getBoundingClientRect().top;
          /** Laisse une partie de l’étape précédente visible (choix pièce pas « coupé »). */
          const stepScrollPeekPx = 88;
          const nextTop = Math.max(0, targetTop - rootTop + scrollRoot.scrollTop - stepScrollPeekPx);
          scrollRoot.scrollTo({ top: nextTop, behavior });
          return;
        }

        target.scrollIntoView({ behavior, block: "start", inline: "nearest" });
      };

      if (scrollStepRafRef.current !== null) {
        cancelAnimationFrame(scrollStepRafRef.current);
      }
      scrollStepRafRef.current = requestAnimationFrame(() => {
        scrollStepRafRef.current = requestAnimationFrame(() => {
          scrollStepRafRef.current = null;
          run();
        });
      });
    },
    [mobileStepMount],
  );

  const scrollValidateActionsIntoView = useCallback(() => {
    if (typeof window === "undefined") return;

    const run = () => {
      const target = validateActionsRef.current;
      if (!target) return;

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const behavior: ScrollBehavior = reducedMotion ? "auto" : "smooth";
      const scrollRoot = mobileStepMount ? sheetScrollRef.current : sheetBodyInnerRef.current;
      const tailPaddingPx = 20;

      if (scrollRoot) {
        const rootRect = scrollRoot.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const overflowBottom = targetRect.bottom - rootRect.bottom + tailPaddingPx;
        if (overflowBottom > 0) {
          scrollRoot.scrollTo({ top: scrollRoot.scrollTop + overflowBottom, behavior });
          return;
        }
        const overflowTop = rootRect.top - targetRect.top + 12;
        if (targetRect.top < rootRect.top) {
          scrollRoot.scrollTo({ top: Math.max(0, scrollRoot.scrollTop - overflowTop), behavior });
        }
        return;
      }

      target.scrollIntoView({ behavior, block: "end", inline: "nearest" });
    };

    if (scrollStepRafRef.current !== null) {
      cancelAnimationFrame(scrollStepRafRef.current);
    }
    scrollStepRafRef.current = requestAnimationFrame(() => {
      scrollStepRafRef.current = requestAnimationFrame(() => {
        scrollStepRafRef.current = null;
        run();
      });
    });
  }, [mobileStepMount]);

  const advanceToNextStep = useCallback(
    (completedStep: PersonalizeStep) => {
      const next = nextPersonalizeStep(completedStep);
      if (!next) return;
      if (stepAdvanceCooldownRef.current) return;

      stepAdvanceCooldownRef.current = true;
      window.setTimeout(() => {
        stepAdvanceCooldownRef.current = false;
      }, 420);

      if (mobileStepMount) {
        setStep(next);
        return;
      }
      scrollToPersonalizeStep(next);
    },
    [mobileStepMount, scrollToPersonalizeStep],
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
    if (!open) {
      setSurchargeAccepted(false);
      setSansVille(false);
      return;
    }
    skipStepScrollOnOpenRef.current = true;
    textAutoAdvancedRef.current = false;
    setStep("model");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (skipStepScrollOnOpenRef.current) {
      skipStepScrollOnOpenRef.current = false;
      return;
    }
    scrollToPersonalizeStep(step);
  }, [open, scrollToPersonalizeStep, step]);

  useEffect(() => {
    if (!open) return;
    return () => {
      if (scrollStepRafRef.current !== null) {
        cancelAnimationFrame(scrollStepRafRef.current);
        scrollStepRafRef.current = null;
      }
    };
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
    if (!open || initialProductId == null || initialProductId <= 0) return;
    const fromProduct = findAtelierModelForProduct(atelierConfig, initialProductId);
    if (fromProduct) setModelId(fromProduct.id);
    const seededSize = initialSize?.trim();
    if (seededSize) setSize(seededSize);
    onProductSeedConsumed?.();
  }, [atelierConfig, initialProductId, initialSize, onProductSeedConsumed, open]);

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

  const previewLabel = sansVille ? "" : label.trim() ? personalizationPreviewLabel(label) : "";
  const inStock = saleProduct ? isShopProductInStock(saleProduct) : false;
  const cityChoiceOk = sansVille || Boolean(label.trim());
  const canSubmit =
    Boolean(model) && Boolean(size) && cityChoiceOk && surchargeAccepted && inStock;
  const citySuggestions = atelierConfig.suggestedCities;
  const unitPrice = (saleProduct?.price ?? 0) + PERSONALIZATION_SURCHARGE_EUR;
  const cityPresentation = model
    ? resolveAtelierCityTextStyle(model, previewCityColor)
    : { className: "dingry-personalize-city", style: {} as CSSProperties };

  const sizeOptions = model?.sizes.length ? model.sizes : [];
  const sizeGridVars = { "--size-cols": String(sizeOptions.length || ATELIER_CUSTOM_SIZES.length) } as CSSProperties;

  function handleAdd() {
    if (!model || !saleProduct || !size || !isShopProductInStock(saleProduct)) return;
    const shirtLabel = `${model.label} ${model.catalogRef}`.trim();
    const color =
      normalizeAtelierCityColor(previewCityColor) ||
      normalizeAtelierCityColor(model.previewCityColor);
    const line = sansVille
      ? formatPersonalizationSansVille(shirtLabel)
      : formatPersonalizationForCart(label, shirtLabel, {
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

  const mobileStepTitle = PERSONALIZE_STEPS.find((entry) => entry.id === step)?.title ?? "DINGRY CUSTOM";
  const addBtnClass = `dingry-pdp-add-btn dingry-gold-foil-bg w-full ${modalStyles.addBtnGold}`;
  const addLabel =
    saleProduct && !inStock ? "Épuisé" : canSubmit ? "VALIDER MA CUSTOM" : "VALIDER MA CUSTOM";

  const customBrandHeader = (
    <div className={styles.customBrandHeader}>
      <h2 className={`${modalStyles.title} ${styles.customDisplayTitle}`}>DINGRY CUSTOM</h2>
      <p className={`${modalStyles.description} ${styles.customBodySans}`} aria-live="polite">
        Personnalisation atelier — supplément{" "}
        <span className="dingry-numeric dingry-gold-foil-text font-semibold">
          +{PERSONALIZATION_SURCHARGE_EUR}&nbsp;€
        </span>{" "}
        par pièce.
      </p>
    </div>
  );

  const surchargeField = (
    <label
      className={`${styles.fieldInputWrap} flex items-start gap-3`}
      onClick={() => {
        window.setTimeout(() => scrollValidateActionsIntoView(), 0);
      }}
    >
      <input
        type="checkbox"
        checked={surchargeAccepted}
        onChange={(event) => setSurchargeAccepted(event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-[#bf953f]"
      />
      <span className={`${modalStyles.metaText} ${styles.customBodySans} text-sm leading-snug`}>
        J&apos;accepte le supplément personnalisation de{" "}
        <strong className="dingry-numeric dingry-gold-foil-text">
          +{PERSONALIZATION_SURCHARGE_EUR}&nbsp;€
        </strong>{" "}
        par pièce (en plus du prix affiché).
      </span>
    </label>
  );

  function pickModel(option: AtelierCustomModel) {
    setModelId(option.id);
    if (size && !option.sizes.includes(size)) setSize("");
  }

  const modelPicker = (
    <AtelierModelPicker models={models} activeModelId={modelId} onSelect={pickModel} />
  );

  const cityPicker = (
    <fieldset className={`${styles.fieldInputWrap} border-0 p-0`}>
      <legend className={modalStyles.sectionLabel}>Inscris ta ville</legend>
      <div
        className={`${styles.cityChipRow} ${modalStyles.chipRow} mt-2`}
        role="group"
        aria-label="Villes suggérées pour la pièce"
      >
        {citySuggestions.map((city) => {
          const active = !sansVille && personalizationPreviewLabel(label) === city;
          return (
            <button
              key={city}
              type="button"
              onClick={() => {
                setSansVille(false);
                setLabel(clampPersonalizationLabel(city));
              }}
              aria-pressed={active}
              aria-label={`Apposer ${city} sur la pièce`}
              className={`${styles.cityChip} ${active ? styles.cityChipActive : ""}`}
            >
              {city}
            </button>
          );
        })}
      </div>
    </fieldset>
  );

  const labelField = (
    <label className={`block ${styles.fieldInputWrap}`}>
      <span className={modalStyles.sectionLabel}>Ville sur la pièce</span>
      <input
        type="text"
        value={label}
        onChange={(e) => {
          setSansVille(false);
          setLabel(clampPersonalizationLabel(e.target.value));
        }}
        onBlur={() => {
          if (textAutoAdvancedRef.current || !label.trim()) return;
          textAutoAdvancedRef.current = true;
          advanceToNextStep("text");
        }}
        placeholder="Ex. PARIS, MARSEILLE, LYON"
        className={styles.fieldInput}
        aria-label="Inscris ta ville"
        maxLength={PERSONALIZATION_MAX_LABEL_LENGTH}
        autoComplete="off"
        disabled={sansVille}
      />
    </label>
  );

  const qtyRow = (
    <div className={`${modalStyles.qtyRow} ${styles.qtyRowSpaced}`}>
      <div className={modalStyles.qtyLead}>
        <span className={modalStyles.qtyLabel}>Quantité</span>
        <p className={`${modalStyles.qtyPrice} dingry-gold-foil-text`}>{unitPrice * qty}€</p>
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
  );

  const modelSection = (
    <div className={`${modalStyles.section} ${styles.sheetStepSection}`}>
      <p className={`${modalStyles.sectionLabel} ${styles.mobileOnlyBlock}`}>
        {personalizeStepHeading("model")}
      </p>
      <div className={styles.mobileOnlyBlock}>{modelPicker}</div>
    </div>
  );

  const textSection = (
    <div className={`${modalStyles.section} ${styles.sheetStepSection}`}>
      <p className={`${modalStyles.sectionLabel} ${styles.mobileOnlyBlock}`}>
        {personalizeStepHeading("text")}
      </p>
      <div className={styles.textCityBlock}>{cityPicker}</div>
      <div>{labelField}</div>
    </div>
  );

  const recapSummaryLine = [
    model?.label ?? "—",
    sansVille ? "Sans ville" : previewLabel || "—",
    size || "—",
  ].join(" · ");

  const validateSection = (
    <div className={`${modalStyles.section} ${styles.sheetStepSection}`}>
      <p className={`${modalStyles.sectionLabel} ${styles.mobileOnlyBlock}`}>
        {personalizeStepHeading("validate")}
      </p>
      <details className={styles.customRecapAccordion}>
        <summary className={styles.customRecapSummary}>
          <span className={styles.customRecapSummaryLead}>
            <span className={modalStyles.metaLabel}>Récapitulatif</span>
            <span className={styles.customRecapSummaryHint}>{recapSummaryLine}</span>
          </span>
          <span className={styles.customRecapSummaryEnd}>
            <span className={`${styles.customRecapSummaryTotal} dingry-gold-foil-text dingry-numeric`}>
              {saleProduct ? `${unitPrice * qty}€` : "—"}
            </span>
            <span className={styles.customRecapSummaryChevron} aria-hidden>
              ▾
            </span>
          </span>
        </summary>
        <div className={styles.customRecapAccordionBody}>
          <dl className={styles.customRecap}>
            <div className={styles.customRecapRow}>
              <dt className={modalStyles.metaLabel}>Pièce</dt>
              <dd className={modalStyles.metaText}>{model?.label ?? "—"}</dd>
            </div>
            <div className={styles.customRecapRow}>
              <dt className={modalStyles.metaLabel}>Ville</dt>
              <dd className={modalStyles.metaText}>{sansVille ? "Sans ville" : previewLabel || "—"}</dd>
            </div>
            <div className={styles.customRecapRow}>
              <dt className={modalStyles.metaLabel}>Taille</dt>
              <dd className={`${modalStyles.metaText} dingry-numeric`}>{size || "—"}</dd>
            </div>
            <div className={styles.customRecapRow}>
              <dt className={modalStyles.metaLabel}>Quantité</dt>
              <dd className={`${modalStyles.metaText} dingry-numeric`}>{qty}</dd>
            </div>
            <div className={styles.customRecapRow}>
              <dt className={modalStyles.metaLabel}>Prix unitaire</dt>
              <dd className={`${modalStyles.metaText} dingry-numeric`}>
                {saleProduct ? `${unitPrice}€` : "—"}
                <span className={styles.customRecapSurcharge}>
                  {" "}
                  (incl. +{PERSONALIZATION_SURCHARGE_EUR}&nbsp;€ custom)
                </span>
              </dd>
            </div>
            <div className={`${styles.customRecapRow} ${styles.customRecapTotal}`}>
              <dt className={modalStyles.metaLabel}>Total</dt>
              <dd className={`${modalStyles.metaText} dingry-numeric dingry-gold-foil-text font-semibold`}>
                {saleProduct ? `${unitPrice * qty}€` : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </details>
      <div ref={validateActionsRef} className={styles.validateActions}>
        <div className="mt-3">{surchargeField}</div>
        {!mobileStepMount ? (
          <button type="button" onClick={handleAdd} disabled={!canSubmit} className={`${addBtnClass} mt-4`}>
            {addLabel}
          </button>
        ) : null}
      </div>
    </div>
  );

  const sizeSection = (
    <div className={`${modalStyles.section} ${styles.sheetStepSection}`}>
      <p className={`${modalStyles.sizeLabel} ${styles.mobileOnlyBlock}`}>
        {personalizeStepHeading("size")}
      </p>
      <div className={`${modalStyles.sizeGrid} ${modalStyles.sizeGridTight} ${styles.sheetSizeGrid}`} style={sizeGridVars}>
        {sizeOptions.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={size === s}
            onClick={() => {
              setSize(s);
              advanceToNextStep("size");
            }}
            onPointerDown={(event) => {
              if (event.pointerType === "touch") {
                setSize(s);
              }
            }}
            className={`${modalStyles.sizeBtn} ${size === s ? modalStyles.sizeOn : ""}`}
          >
            {s}
          </button>
        ))}
      </div>
      {qtyRow}
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
            className={`${modalStyles.panel} ${modalStyles.dingryPdpDark} ${styles.sheetPanel} dingry-pdp-dark dingry-sale-ui`}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={MODAL_PANEL_SPRING}
            role="dialog"
            aria-modal="true"
            aria-label="Personnalise ta pièce"
          >
            <header className={`${styles.sheetHeader} ${styles.mobileOnlyBlock}`}>
              <div className={styles.sheetHeaderCopy}>
                {customBrandHeader}
                <p className={`${modalStyles.brandEyebrow} ${styles.sheetHeaderStep}`}>{mobileStepTitle}</p>
              </div>
              <button type="button" onClick={onClose} className={styles.sheetHeaderClose} aria-label="Fermer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <div className={styles.sheetChrome}>
              <div ref={sheetScrollRef} className={styles.sheetScroll}>
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
                  showCityOverlay={!sansVille && Boolean(previewLabel)}
                />
              ) : null}
              {!mobileStepMount ? (
                <div className={`${styles.desktopOnlyBlock} ${styles.photoModelPicker}`}>
                  <p className={`${modalStyles.sectionLabel} ${styles.photoModelPickerLabel}`}>
                    {personalizeStepHeading("model")}
                  </p>
                  <AtelierModelPicker
                    models={models}
                    activeModelId={modelId}
                    onSelect={pickModel}
                    compact
                    inlineGroups
                    hideCardLabels
                    className={styles.photoModelPickerStrip}
                  />
                </div>
              ) : null}
                </div>

                <div className={`${modalStyles.body} ${styles.sheetBodyMobile}`}>
                  <div ref={sheetBodyInnerRef} className={styles.sheetBodyInner}>
                    {!mobileStepMount ? (
                      <div className={`${styles.desktopOnlyBlock} ${styles.sheetDesktopIntro}`}>
                        <div className={styles.sheetDesktopIntroHead}>
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
                        {customBrandHeader}
                      </div>
                    ) : null}

                    <PersonalizeStepTabs active={step} onChange={setStep} />

                    {mobileStepMount ? (
                      <>
                        <PersonalizeStepPane
                          step="model"
                          active={step}
                          mountActiveOnly
                          sectionRef={registerStepSectionRef}
                        >
                          {modelSection}
                        </PersonalizeStepPane>
                        <PersonalizeStepPane
                          step="text"
                          active={step}
                          mountActiveOnly
                          sectionRef={registerStepSectionRef}
                        >
                          {textSection}
                        </PersonalizeStepPane>
                        <PersonalizeStepPane
                          step="size"
                          active={step}
                          mountActiveOnly
                          sectionRef={registerStepSectionRef}
                        >
                          {sizeSection}
                        </PersonalizeStepPane>
                        <PersonalizeStepPane
                          step="validate"
                          active={step}
                          mountActiveOnly
                          sectionRef={registerStepSectionRef}
                        >
                          {validateSection}
                        </PersonalizeStepPane>
                      </>
                    ) : (
                      <>
                        <PersonalizeStepSection step="text" sectionRef={registerStepSectionRef}>
                          {textSection}
                        </PersonalizeStepSection>
                        <PersonalizeStepSection step="size" sectionRef={registerStepSectionRef}>
                          {sizeSection}
                        </PersonalizeStepSection>
                        <PersonalizeStepSection step="validate" sectionRef={registerStepSectionRef}>
                          {validateSection}
                        </PersonalizeStepSection>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {mobileStepMount && step === "validate" ? (
              <footer className={`${styles.sheetFooter} ${styles.mobileOnlyBlock}`}>
                <div className={styles.sheetFooterMeta}>
                  <span>Total</span>
                  <span className={`${styles.sheetFooterPrice} dingry-gold-foil-text`}>{unitPrice * qty}€</span>
                </div>
                <button type="button" onClick={handleAdd} disabled={!canSubmit} className={addBtnClass}>
                  {addLabel}
                </button>
              </footer>
            ) : null}
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
        showCityOverlay={!sansVille && Boolean(previewLabel)}
      />
    ) : null}
    </>
  );
}
