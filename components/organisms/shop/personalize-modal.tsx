"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { isShopProductInStock, type ShopProduct } from "@/lib/catalog";
import { PERSONALIZATION_SURCHARGE_EUR } from "@/lib/checkout-draft";
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

  function handleAdd() {
    if (!product || !size || !isShopProductInStock(product)) return;
    const line = personalizationLine(label, shirt.label);
    if (!line) return;
    onSubmit({ size, qty, personalization: line });
  }

  return (
    <AnimatePresence>
      {open ? (
        <div
          key="dingry-personalize-modal"
          data-dingry-personalize-modal=""
          className="fixed inset-0 z-[65] flex items-center justify-center p-4 md:p-8"
        >
          <motion.div
            className="absolute inset-0 bg-[#050505]/90 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MODAL_OVERLAY_TRANSITION}
            onClick={onClose}
          />
          <motion.div
            className="relative z-10 bg-[#0a0a0a] border border-white/[0.06] w-full max-w-5xl max-h-[92vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={MODAL_PANEL_SPRING}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 z-20 w-11 h-11 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              aria-label="Fermer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="p-8 md:p-10 border-b border-white/[0.06]">
              <p className="text-[10px] tracking-[0.35em] text-[#0066FF] uppercase mb-2">Custom · Studio</p>
              <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight pr-12">
                Configurateur tee personnalisé
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/55">
                Choisissez la couleur, saisissez votre texte, vérifiez l&apos;aperçu recto, puis ajoutez au panier.
              </p>
              <ol className="mt-6 flex flex-wrap gap-2 text-[9px] tracking-[0.16em] text-white/40 uppercase md:gap-3 md:text-[10px]">
                <li className="rounded-full border border-white/15 px-3 py-1.5">1 · Couleur</li>
                <li className="rounded-full border border-white/15 px-3 py-1.5">2 · Texte</li>
                <li className="rounded-full border border-white/15 px-3 py-1.5">3 · Taille & quantité</li>
              </ol>
            </div>
            <div className="p-8 md:p-10 grid md:grid-cols-2 gap-10 md:gap-12 items-start">
              <div className="relative mx-auto w-full max-w-xs" style={{ aspectRatio: "3/4" }}>
                <img
                  src={shirt.image}
                  alt={`Tee ${shirt.label} — vue recto`}
                  className="w-full h-full object-cover"
                  style={{ filter: "brightness(0.92) contrast(1.05)" }}
                />
                <div
                  className="dingry-personalize-city pointer-events-none absolute left-1/2 -translate-x-1/2 text-center uppercase"
                  style={{ top: shirt.cityTop, width: "78%", fontSize: shirt.citySize }}
                  aria-live="polite"
                >
                  {previewLabel}
                </div>
                <p className="absolute top-3 left-0 right-0 text-center text-[9px] tracking-[0.25em] text-white/60 uppercase">
                  Vue recto — sous le logo
                </p>
                <p className="absolute bottom-3 left-0 right-0 text-center text-[9px] tracking-[0.3em] text-white/45 uppercase">
                  Simulation indicative
                </p>
              </div>
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-sm text-white/70 leading-relaxed mb-1">
                    Choisis ta ville et personnalise ton DINGRY
                  </p>
                  <p className="text-sm text-white/45">
                    Personnalisation possible, {PERSONALIZATION_SURCHARGE_EUR}€ par article.
                  </p>
                </div>
                <div>
                  <p className="mb-3 text-[10px] tracking-[0.3em] text-[#0066FF] uppercase">Étape 1 · Couleur du tee</p>
                  <div className="flex flex-wrap gap-2">
                    {PERSONALIZATION_SHIRTS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setShirtId(option.id)}
                        className={`px-4 py-2 text-[11px] tracking-[0.2em] uppercase border transition-colors ${
                          shirtId === option.id
                            ? "bg-[#0066FF] border-[#0066FF] text-white"
                            : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block">
                  <span className="mb-2 block text-[10px] tracking-[0.3em] text-[#0066FF] uppercase">
                    Étape 2 · Ville, pays ou texte
                  </span>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(clampPersonalizationLabel(e.target.value))}
                    placeholder="Ville, Pays"
                    className="w-full rounded-full border border-white/20 bg-[#080808] px-5 py-3.5 text-sm text-white placeholder:text-white/30 focus:border-[#0066FF] focus:outline-none"
                    maxLength={PERSONALIZATION_MAX_LABEL_LENGTH}
                  />
                </label>
                <div>
                  <p className="mb-3 text-[10px] tracking-[0.3em] text-[#0066FF] uppercase">Étape 3 · Taille</p>
                  <div className="grid grid-cols-6 gap-2">
                    {SIZES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        className={`py-2.5 text-xs font-medium tracking-widest border transition-all duration-200 ${
                          size === s
                            ? "bg-[#0066FF] border-[#0066FF] text-white"
                            : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between border-y border-white/[0.08] py-4">
                  <span className="text-[10px] tracking-[0.3em] text-white/40 uppercase">Quantité</span>
                  <div className="flex items-center border border-white/15">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 text-white/60 hover:bg-white hover:text-black transition-colors"
                      aria-label="Diminuer la quantité"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.min(99, q + 1))}
                      className="w-9 h-9 text-white/60 hover:bg-white hover:text-black transition-colors"
                      aria-label="Augmenter la quantité"
                    >
                      +
                    </button>
                  </div>
                </div>
                <p className="text-lg font-bold">
                  {unitPrice * qty}€{" "}
                  <span className="text-xs font-normal text-white/40 tracking-wider">
                    ({unitPrice}€ × {qty})
                  </span>
                </p>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!canSubmit}
                  className={`dingry-add-to-cart-btn w-full py-4 text-xs font-bold tracking-[0.3em] uppercase transition-all duration-300 ${
                    canSubmit
                      ? "bg-[#0066FF] text-white hover:bg-[#0052cc]"
                      : "bg-white/10 text-white/20 cursor-not-allowed"
                  }`}
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
