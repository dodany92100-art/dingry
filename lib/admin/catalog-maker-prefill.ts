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

function applyMakerFicheSnapshot(
  prev: SmartProductAutoTagFormState,
  template: CatalogMakerTemplate,
  ctx: MakerPrefillCtx,
): SmartProductAutoTagFormState {
  const fiche = template.fiche;
  if (!fiche) return prev;
  const gram = (template.sizeGuide ?? "").trim();
  const fromMatrix = applyCatalogProductMatrix(
    prev,
    {
      category: template.category,
      price: template.priceTtc,
      sizes: template.sizes,
      description: fiche.description,
      materials: fiche.materials,
      sizeGuide: gram,
      fabrication: fiche.fabrication,
      limitedEdition: fiche.limitedEdition,
      printPlacement: fiche.printPlacement,
    },
    { editingId: ctx.editingId, existingSkus: ctx.existingSkus, mergeMode: "replace" },
  );
  return {
    ...fromMatrix,
    name: fiche.name || fromMatrix.name,
    variant: fiche.variant || fromMatrix.variant,
    brand: fiche.brand || fromMatrix.brand,
    collection: fiche.collection || fromMatrix.collection,
    colorDeclinations: fiche.colorDeclinations.length > 0 ? [...fiche.colorDeclinations] : fromMatrix.colorDeclinations,
    stock: fiche.stock || fromMatrix.stock,
    printPlacement: fiche.printPlacement || fromMatrix.printPlacement,
  };
}

/** Modèle mémorisé — tarif / tailles ; si `fiche` présente, repris comme une base CRM. */
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
    mergeMode: template.fiche ? "replace" : "fill-empty",
  });
  const withTemplate = withMakerTemplateFields(afterDefaults, template, prev);
  return applyMakerFicheSnapshot(withTemplate, template, ctx);
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
