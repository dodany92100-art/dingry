"use client";

import type { ReactNode } from "react";
import modalStyles from "./product-modal.module.css";
import styles from "./personalize-modal.module.css";

export type PersonalizeStep = "model" | "text" | "size" | "validate";

export const PERSONALIZE_STEP_ORDER: readonly PersonalizeStep[] = ["model", "text", "size", "validate"];

export function nextPersonalizeStep(step: PersonalizeStep): PersonalizeStep | null {
  const index = PERSONALIZE_STEP_ORDER.indexOf(step);
  if (index < 0 || index >= PERSONALIZE_STEP_ORDER.length - 1) return null;
  return PERSONALIZE_STEP_ORDER[index + 1] ?? null;
}

export const PERSONALIZE_STEPS: readonly {
  id: PersonalizeStep;
  label: string;
  title: string;
  heading: string;
}[] = [
  { id: "model", label: "Pièce", title: "01 — Choisis ta pièce", heading: "01 — CHOISIS TA PIÈCE" },
  { id: "text", label: "Texte", title: "02 — Ton texte", heading: "02 — TON TEXTE" },
  { id: "size", label: "Taille", title: "03 — Ta taille", heading: "03 — TA TAILLE" },
  { id: "validate", label: "Valider", title: "04 — Valide", heading: "04 — VALIDE TA PERSONNALISATION" },
];

export function personalizeStepHeading(step: PersonalizeStep): string {
  return PERSONALIZE_STEPS.find((entry) => entry.id === step)?.heading ?? "";
}

type PersonalizeStepTabsProps = {
  active: PersonalizeStep;
  onChange: (step: PersonalizeStep) => void;
};

export function PersonalizeStepTabs({ active, onChange }: PersonalizeStepTabsProps) {
  return (
    <div
      className={`${modalStyles.chipRow} ${styles.stepTabs} ${styles.mobileOnlyBlock}`}
      role="tablist"
      aria-label="Étapes configurateur"
    >
      {PERSONALIZE_STEPS.map((entry) => (
        <button
          key={entry.id}
          type="button"
          role="tab"
          aria-selected={active === entry.id}
          onClick={() => onChange(entry.id)}
          id={`personalize-tab-${entry.id}`}
          className={`${modalStyles.jerseyChip} ${styles.stepTab} ${active === entry.id ? modalStyles.jerseyOn : ""}`}
        >
          {entry.label}
        </button>
      ))}
    </div>
  );
}

type PersonalizeStepPaneProps = {
  step: PersonalizeStep;
  active: PersonalizeStep;
  children: ReactNode;
  /** Mobile : une seule étape montée (moins de DOM, meilleur INP). */
  mountActiveOnly?: boolean;
  sectionRef?: (step: PersonalizeStep, el: HTMLElement | null) => void;
};

export function PersonalizeStepPane({
  step,
  active,
  children,
  mountActiveOnly = false,
  sectionRef,
}: PersonalizeStepPaneProps) {
  const isActive = active === step;
  if (mountActiveOnly && !isActive) return null;

  return (
    <div
      ref={(el) => sectionRef?.(step, el)}
      className={`${styles.stepPane} ${isActive ? styles.stepPaneActive : ""}`}
      role="tabpanel"
      aria-labelledby={`personalize-tab-${step}`}
      data-personalize-step={step}
    >
      {children}
    </div>
  );
}

type PersonalizeStepSectionProps = {
  step: PersonalizeStep;
  children: ReactNode;
  sectionRef?: (step: PersonalizeStep, el: HTMLElement | null) => void;
};

/** Bloc titre + contenu (desktop : toutes les étapes visibles). */
export function PersonalizeStepSection({ step, children, sectionRef }: PersonalizeStepSectionProps) {
  return (
    <section
      ref={(el) => sectionRef?.(step, el)}
      className={styles.customStepBlock}
      aria-labelledby={`personalize-step-${step}`}
      data-personalize-step={step}
    >
      <h3 id={`personalize-step-${step}`} className={modalStyles.sectionLabel}>
        {personalizeStepHeading(step)}
      </h3>
      {children}
    </section>
  );
}