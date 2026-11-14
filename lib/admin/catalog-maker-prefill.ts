import { colorDeclinationsFromAdminProduct } from "@/lib/admin/catalog-product-maker-bridge";
import type { AdminProduct } from "@/lib/admin/types";
import {
  applyCatalogProductMatrix,
  applyCategoryDefaults,
  catalogMatrixFromAdminProduct,
  type SmartProductAutoTagFormState,
} from "@/lib/admin/smart-product-auto-attributes";
import type { CatalogMakerTemplate } from "@/lib/validations/catalog-maker-template";

type MakerPrefillCtx = { editingId: string | null; existingSkus: readonly string[] };

/** Réapplique les champs issus du modèle après `applyCategoryDefaults` (évite l’écrasement des tailles sur une fiche neuve). */
function withMakerTemplateFields(
  afterDefaults: SmartProductAutoTagFormState,
  template: CatalogMakerTemplate,
  prev: SmartProductAutoTagFormState,
): SmartProductAutoTagFormState {
  const gram = (template.sizeGuide ?? "").trim();
  return {
    ...afterDefaults,
    category: template.category,
    price: String(template.priceTtc),
    sizes: [...template.sizes],
    sizeGuide: gram || afterDefaults.sizeGuide,
  };
}

/** Injection maker — défauts tarifaires / tailles, sans imposer nom, SKU, couleur. */
export function applyMakerTemplateToFormState(
  prev: SmartProductAutoTagFormState,
  template: CatalogMakerTemplate,
  ctx: MakerPrefillCtx,
): SmartProductAutoTagFormState {
  const gram = (template.sizeGuide ?? "").trim();
  const merged: SmartProductAutoTagFormState = {
    ...prev,
    category: template.category,
    price: String(template.priceTtc),
    sizes: [...template.sizes],
    sizeGuide: gram || prev.sizeGuide,
  };
  const afterDefaults = applyCategoryDefaults(merged, template.category, {
    editingId: ctx.editingId,
    existingSkus: ctx.existingSkus,
    mergeMode: "fill-empty",
  });
  return withMakerTemplateFields(afterDefaults, template, prev);
}

/** Fiche CRM catalogue — story, tarif, tailles + nom / variante / couleurs pour cloner la base. */
export function applyCatalogProductMakerPrefill(
  prev: SmartProductAutoTagFormState,
  product: AdminProduct,
  ctx: MakerPrefillCtx,
): SmartProductAutoTagFormState {
  const fromMatrix = applyCatalogProductMatrix(prev, catalogMatrixFromAdminProduct(product), {
    editingId: ctx.editingId,
    existingSkus: ctx.existingSkus,
    mergeMode: "replace",
  });
  const colors = colorDeclinationsFromAdminProduct(product);
  return {
    ...fromMatrix,
    name: product.name,
    variant: product.variant,
    colorDeclinations: colors,
    stock: String(product.stock),
    printPlacement: product.printPlacement || fromMatrix.printPlacement,
  };
}
