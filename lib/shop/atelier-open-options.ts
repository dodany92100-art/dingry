import type { AtelierModelPickerGroupId } from "@/lib/atelier-custom-config";

/** Options d’ouverture du configurateur atelier (nav, fiche produit, hero, rubrique catalogue). */
export type OpenCustomOptions = {
  initialLabel?: string;
  initialProductId?: number;
  initialSize?: string;
  /** Restreint le picker aux modèles T-shirts ou Hoodies (entrée depuis le catalogue). */
  initialModelGroup?: AtelierModelPickerGroupId;
};
