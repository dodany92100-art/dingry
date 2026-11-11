"use client";

import type { ReactNode } from "react";
import styles from "./personalize-modal.module.css";

export type PersonalizeStep = "model" | "text" | "size";

export const PERSONALIZE_STEPS: readonly { id: PersonalizeStep; label: string; title: string }[] = [
  { id: "model", label: "Modèle", title: "1 — Modèle" },
  { id: "text", label: "Texte", title: "2 — Texte" },
  { id: "size", label: "Taille", title: "3 — Taille & quantité" },
];

type PersonalizeStepTabsProps = {
  active: PersonalizeStep;
  onChange: (step: PersonalizeStep) => void;
};

export function PersonalizeStepTabs({ active, onChange }: PersonalizeStepTabsProps) {
  return (
    <div className={`${styles.stepTabs} ${styles.mobileOnlyBlock}`} role="tablist" aria-label="Étapes configurateur">
      {PERSONALIZE_STEPS.map((entry) => (
        <button
          key={entry.id}
          type="button"
          role="tab"
          aria-selected={active === entry.id}
          onClick={() => onChange(entry.id)}
          id={`personalize-tab-${entry.id}`}
          className={`${styles.stepTab} ${active === entry.id ? styles.stepTabActive : ""}`}
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
};

export function PersonalizeStepPane({
  step,
  active,
  children,
  mountActiveOnly = false,
}: PersonalizeStepPaneProps) {
  const isActive = active === step;
  if (mountActiveOnly && !isActive) return null;

  return (
    <div
      className={`${styles.stepPane} ${isActive ? styles.stepPaneActive : ""}`}
      role="tabpanel"
      aria-labelledby={`personalize-tab-${step}`}
    >
      {children}
    </div>
  );
}
