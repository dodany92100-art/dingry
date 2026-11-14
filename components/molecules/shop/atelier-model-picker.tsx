"use client";

import { useEffect, useRef } from "react";
import { DingryProductImage } from "@/components/atoms/dingry-product-image";
import {
  groupAtelierModelsForPicker,
  type AtelierCustomModel,
} from "@/lib/atelier-custom-config";
import { cn } from "@/lib/utils";
import styles from "./atelier-model-picker.module.css";

type AtelierModelPickerProps = {
  models: readonly AtelierCustomModel[];
  activeModelId: string;
  onSelect: (model: AtelierCustomModel) => void;
  className?: string;
  compact?: boolean;
};

export function AtelierModelPicker({
  models,
  activeModelId,
  onSelect,
  className,
  compact = false,
}: AtelierModelPickerProps) {
  const groups = groupAtelierModelsForPicker(models);
  const activeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeButtonRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeModelId]);

  if (models.length === 0) {
    return <p className={styles.empty}>Atelier temporairement indisponible.</p>;
  }

  return (
    <div className={cn(styles.root, compact && styles.rootCompact, className)}>
      {groups.map((group) => (
        <section key={group.id} className={styles.group} aria-labelledby={`atelier-picker-${group.id}`}>
          <p id={`atelier-picker-${group.id}`} className={styles.groupLabel}>
            {group.label}
          </p>
          <div className={styles.track} role="listbox" aria-label={group.label}>
            {group.models.map((model) => {
              const active = model.id === activeModelId;
              return (
                <button
                  key={model.id}
                  ref={active ? activeButtonRef : undefined}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => onSelect(model)}
                  className={`${styles.card} ${active ? styles.cardActive : ""}`}
                >
                  <span className={styles.thumbWrap}>
                    <DingryProductImage
                      src={model.previewImageUrl}
                      alt=""
                      width={120}
                      height={160}
                      deliveryWidth={280}
                      className={styles.thumb}
                    />
                  </span>
                  <span className={styles.meta}>
                    <span className={styles.name}>{model.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
