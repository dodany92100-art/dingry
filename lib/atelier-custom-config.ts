import type { ShopProduct } from "@/lib/catalog";
import { DINGRY_PRODUCT_MEDIA } from "@/lib/dingry-product-media";
import { IMAGES, PRODUCTS, SIZES } from "@/lib/shop-data";

export type AtelierPreviewTextStyle = "light" | "gold" | "dark";

export type AtelierCustomModel = {
  id: string;
  label: string;
  /** Référence affichée (#11, #25…). */
  catalogRef: string;
  productId: number;
  enabled: boolean;
  basePriceEur: number;
  sizes: readonly string[];
  previewImageUrl: string;
  swatch: string;
  swatchText: string;
  cityTop: string;
  citySize: string;
  previewTextStyle: AtelierPreviewTextStyle;
};

export type ShopAtelierCustomConfig = {
  enabled: boolean;
  models: readonly AtelierCustomModel[];
  suggestedCities: readonly string[];
};

export type AdminAtelierCustomConfig = ShopAtelierCustomConfig & {
  updatedAt: string;
};

export const SHOP_ATELIER_CUSTOM_DEFAULT: AdminAtelierCustomConfig = {
  enabled: true,
  updatedAt: "",
  suggestedCities: ["PARIS", "LYON", "MARSEILLE", "MILAN"],
  models: [
    {
      id: "tee-blanc",
      label: "T-shirt blanc",
      catalogRef: "#11",
      productId: 11,
      enabled: true,
      basePriceEur: 35,
      sizes: SIZES,
      previewImageUrl: DINGRY_PRODUCT_MEDIA.teeWhiteRecto,
      swatch: "#f4f4f2",
      swatchText: "#161616",
      cityTop: "57%",
      citySize: "clamp(0.55rem, 2.9vw, 0.82rem)",
      previewTextStyle: "dark",
    },
    {
      id: "tee-noir",
      label: "T-shirt noir",
      catalogRef: "#25",
      productId: 21,
      enabled: true,
      basePriceEur: 35,
      sizes: SIZES,
      previewImageUrl: DINGRY_PRODUCT_MEDIA.teeBlackRecto ?? IMAGES.tee11,
      swatch: "#161616",
      swatchText: "#ffffff",
      cityTop: "57%",
      citySize: "clamp(0.55rem, 2.9vw, 0.82rem)",
      previewTextStyle: "gold",
    },
  ],
};

export function enabledAtelierModels(config: ShopAtelierCustomConfig): AtelierCustomModel[] {
  if (!config.enabled) return [];
  return config.models.filter((model) => model.enabled);
}

export function personalizationProductIds(config: ShopAtelierCustomConfig): number[] {
  const fromModels = enabledAtelierModels(config).map((m) => m.productId);
  return [...new Set([24, ...fromModels])];
}

export function previewTextStyleClass(style: AtelierPreviewTextStyle): string {
  if (style === "gold") return "dingry-personalize-city dingry-personalize-city--gold";
  if (style === "dark") return "dingry-personalize-city dingry-personalize-city--dark";
  return "dingry-personalize-city dingry-personalize-city--light";
}

/** Produit vitrine pour le panier (prix / visuel issus du modèle atelier). */
export function resolvePersonalizationShopProduct(
  products: readonly ShopProduct[],
  model: AtelierCustomModel,
  seed: readonly ShopProduct[] = PRODUCTS,
): ShopProduct | undefined {
  const base =
    products.find((p) => p.id === model.productId) ?? seed.find((p) => p.id === model.productId);
  if (!base) return undefined;
  return {
    ...base,
    price: model.basePriceEur >= 0 ? model.basePriceEur : base.price,
    image: model.previewImageUrl.trim() ? model.previewImageUrl : base.image,
  };
}

export function resolveShopAtelierCustomConfig(
  stored: AdminAtelierCustomConfig | ShopAtelierCustomConfig | null | undefined,
): ShopAtelierCustomConfig {
  if (!stored) {
    return {
      enabled: SHOP_ATELIER_CUSTOM_DEFAULT.enabled,
      models: SHOP_ATELIER_CUSTOM_DEFAULT.models,
      suggestedCities: SHOP_ATELIER_CUSTOM_DEFAULT.suggestedCities,
    };
  }
  return {
    enabled: stored.enabled,
    models: stored.models.length > 0 ? stored.models : SHOP_ATELIER_CUSTOM_DEFAULT.models,
    suggestedCities:
      stored.suggestedCities.length > 0
        ? stored.suggestedCities
        : SHOP_ATELIER_CUSTOM_DEFAULT.suggestedCities,
  };
}
