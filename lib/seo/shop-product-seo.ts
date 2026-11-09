import { dingryProductSeoSlug } from "@/lib/catalog/dingry-variant-naming";

type ProductSeoInput = {
  id: number;
  name: string;
  category?: string;
  seoSlug?: string;
};

/** Canonical = fiche parent unique (pas d’URL par couleur — évite duplicate content). */
export function shopProductCanonicalPath(
  basePath: string,
  product: ProductSeoInput,
  siteParams?: { produit?: string | null },
): string {
  const base = basePath.replace(/\/$/, "") || "/";
  const slug =
    product.seoSlug?.trim() ||
    (siteParams?.produit?.trim() ? siteParams.produit.split("?")[0] : "") ||
    dingryProductSeoSlug(product.name, product.category);
  if (!slug) return base;
  const params = new URLSearchParams();
  params.set("produit", slug);
  return `${base}?${params.toString()}`;
}

export function shopProductDocumentTitle(productName: string, brand = "DINGRY"): string {
  const name = productName.trim() || "Boutique";
  return `${name} · ${brand}`;
}
