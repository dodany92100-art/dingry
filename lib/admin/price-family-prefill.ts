import { normalizeCrmProductNameField, type PriceFamily } from "@/lib/validations/price-family";
import type { SmartProductAutoTagFormState } from "@/lib/admin/smart-product-auto-attributes";
import { applyCategoryDefaults } from "@/lib/admin/smart-product-auto-attributes";

export function applyPriceFamilyToFormState(
  prev: SmartProductAutoTagFormState,
  family: PriceFamily,
  ctx: { editingId: string | null; existingSkus: readonly string[] },
): SmartProductAutoTagFormState {
  const merged: SmartProductAutoTagFormState = {
    ...prev,
    category: family.category,
    name: normalizeCrmProductNameField(family.modelName),
    variant: family.color,
    price: String(family.priceTtc),
    sizes: [...family.sizes],
  };
  return applyCategoryDefaults(merged, family.category, {
    editingId: ctx.editingId,
    existingSkus: ctx.existingSkus,
    mergeMode: "fill-empty",
  });
}
