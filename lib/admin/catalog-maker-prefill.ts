import type { SmartProductAutoTagFormState } from "@/lib/admin/smart-product-auto-attributes";
import { applyCategoryDefaults } from "@/lib/admin/smart-product-auto-attributes";
import type { CatalogMakerTemplate } from "@/lib/validations/catalog-maker-template";

/** Injection maker — défauts tarifaires / tailles, sans imposer nom, SKU, couleur. */
export function applyMakerTemplateToFormState(
  prev: SmartProductAutoTagFormState,
  template: CatalogMakerTemplate,
  ctx: { editingId: string | null; existingSkus: readonly string[] },
): SmartProductAutoTagFormState {
  const gram = (template.sizeGuide ?? "").trim();
  const merged: SmartProductAutoTagFormState = {
    ...prev,
    category: template.category,
    price: String(template.priceTtc),
    sizes: [...template.sizes],
    sizeGuide: gram && !prev.sizeGuide.trim() ? gram : prev.sizeGuide,
  };
  return applyCategoryDefaults(merged, template.category, {
    editingId: ctx.editingId,
    existingSkus: ctx.existingSkus,
    mergeMode: "fill-empty",
  });
}
