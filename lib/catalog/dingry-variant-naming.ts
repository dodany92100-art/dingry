/** Conventions SKU / R2 / SEO — marque DINGRY. */

export const DINGRY_BRAND = "DINGRY";

export function dingrySlugSegment(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
}

/** Ex. `hoodie-essential` pour URL canonical. */
export function dingryProductSeoSlug(productName: string, category?: string): string {
  const name = dingrySlugSegment(productName);
  if (name) return name;
  return category ? dingrySlugSegment(category) : "produit";
}

/**
 * SKU parent marketing : `DINGRY-HOODIE-ESSENTIAL` (lisible, distinct du CRM `DGRY-TS-01` si besoin).
 * `family` = HOODIE, TEE… · `handle` = mot-clé court produit.
 */
export function buildDingryMarketingParentSku(family: string, handle: string): string {
  const fam = dingrySlugSegment(family).toUpperCase().replace(/-/g, "_") || "ITEM";
  const h = dingrySlugSegment(handle).toUpperCase().replace(/-/g, "_").slice(0, 20) || "STD";
  return `${DINGRY_BRAND}-${fam}-${h}`;
}

/** SKU variante : `DINGRY-HOODIE-ESS-RED`. */
export function buildDingryVariantSku(parentSku: string, colorLabel: string): string {
  const base = parentSku.trim().toUpperCase();
  const color = dingrySlugSegment(colorLabel).toUpperCase().replace(/-/g, "_") || "STD";
  if (!base) return `${DINGRY_BRAND}-${color}`;
  if (base.endsWith(`-${color}`)) return base;
  return `${base}-${color}`;
}

/** Nom fichier R2 : `dingry-hoodie-essential-rouge.webp`. */
export function dingryR2VariantFilename(productName: string, colorLabel: string, ext = "webp"): string {
  const stem = dingrySlugSegment(`${DINGRY_BRAND}-${productName}-${colorLabel}`);
  return `${stem}.${ext.replace(/^\./, "")}`;
}

/** Clé objet R2 (bucket dingrybuckets) : `dingry/products/{id}/variants/…`. */
export function dingryR2VariantObjectKey(productId: string, productName: string, colorLabel: string): string {
  const file = dingryR2VariantFilename(productName, colorLabel);
  return `dingry/products/${productId}/variants/${file}`;
}

/** Alt SEO : "Hoodie Essential DINGRY couleur Rouge". */
export function buildVariantAltText(productName: string, colorLabel: string): string {
  const name = productName.trim() || "Produit";
  const color = colorLabel.trim();
  if (!color) return `${name} ${DINGRY_BRAND}`;
  const pretty =
    color.length <= 3
      ? color.toUpperCase()
      : `${color.charAt(0).toUpperCase()}${color.slice(1).toLowerCase()}`;
  return `${name} ${DINGRY_BRAND} couleur ${pretty}`;
}
