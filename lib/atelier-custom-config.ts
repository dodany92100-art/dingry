import type { CSSProperties } from "react";
import type { ShopProduct } from "@/lib/catalog";
import { CUSTOM_BANNER_SUGGESTED_CITIES } from "@/lib/custom-city-banner";
import {
  DINGRY_PRODUCT_MEDIA,
  DINGRY_SWEAT_PRODUCT_IDS,
  DINGRY_TEE_PRODUCT_IDS,
} from "@/lib/dingry-product-media";
import { isShopTeeCategory, resolveShopCategory } from "@/lib/shop-catalog";
import { IMAGES, PRODUCTS } from "@/lib/shop-data";

/** Grille atelier tee — XS → 3XL (hors TU). */
export const ATELIER_CUSTOM_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"] as const;

const LEGACY_ATELIER_SIZES = ["S", "M", "L", "XL", "TU"] as const;

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
  /** Couleur du libellé ville sur l’aperçu (`#rrggbb`). Vide = variante `previewTextStyle`. */
  previewCityColor: string;
};

export type ShopAtelierCustomConfig = {
  enabled: boolean;
  models: readonly AtelierCustomModel[];
  suggestedCities: readonly string[];
};

export type AdminAtelierCustomConfig = ShopAtelierCustomConfig & {
  updatedAt: string;
};

const CITY_TOP_PERCENT_MIN = 28;
const CITY_TOP_PERCENT_MAX = 62;

/** Parse `cityTop` type `"43%"` → nombre (fallback 44). */
export function parseCityTopPercent(cityTop: string): number {
  const match = /^([\d.]+)\s*%$/.exec(cityTop.trim());
  const parsed = match ? Number(match[1]) : 44;
  if (!Number.isFinite(parsed)) return 44;
  return Math.min(CITY_TOP_PERCENT_MAX, Math.max(CITY_TOP_PERCENT_MIN, parsed));
}

export function formatCityTopPercent(value: number): string {
  const clamped = Math.min(CITY_TOP_PERCENT_MAX, Math.max(CITY_TOP_PERCENT_MIN, value));
  const rounded = Math.round(clamped * 2) / 2;
  return `${rounded}%`;
}

export const ATELIER_CITY_TOP_SLIDER = {
  min: CITY_TOP_PERCENT_MIN,
  max: CITY_TOP_PERCENT_MAX,
  step: 0.5,
} as const;

const CITY_SIZE_REM_MIN = 0.32;
const CITY_SIZE_REM_MAX = 0.72;

export const ATELIER_CITY_SIZE_SLIDER = {
  min: CITY_SIZE_REM_MIN,
  max: CITY_SIZE_REM_MAX,
  step: 0.02,
} as const;

/** Extrait la valeur max `rem` d’un `clamp(…, …, Xrem)`. */
export function parseCitySizeMaxRem(citySize: string): number {
  const match = /clamp\(\s*[^,]+,\s*[^,]+,\s*([\d.]+)\s*rem\s*\)/i.exec(citySize.trim());
  const parsed = match ? Number(match[1]) : 0.5;
  if (!Number.isFinite(parsed)) return 0.5;
  return Math.min(CITY_SIZE_REM_MAX, Math.max(CITY_SIZE_REM_MIN, parsed));
}

export function formatCitySizeClamp(maxRem: number): string {
  const max = Math.min(CITY_SIZE_REM_MAX, Math.max(CITY_SIZE_REM_MIN, Math.round(maxRem * 100) / 100));
  const min = Math.round(max * 0.68 * 100) / 100;
  const mid = Math.round(max * 3.3 * 100) / 100;
  return `clamp(${min}rem, ${mid}vw, ${max}rem)`;
}

export const ATELIER_CITY_COLOR_PRESETS = [
  { id: "noir", label: "Noir", color: "#000000" },
  { id: "blanc", label: "Blanc", color: "#ffffff" },
  { id: "gris", label: "Gris", color: "#b8b8b8" },
  { id: "bleu", label: "Bleu", color: "#1e4a8a" },
] as const;

export type AtelierCityColorPresetId = (typeof ATELIER_CITY_COLOR_PRESETS)[number]["id"];

/** Tees clairs : pas de blanc ; tees foncés : pas de noir. */
export function atelierCityColorPresetsForModel(modelId: string) {
  if (modelId === "tee-blanc") {
    return ATELIER_CITY_COLOR_PRESETS.filter((preset) => preset.id !== "blanc");
  }
  if (modelId === "tee-noir") {
    return ATELIER_CITY_COLOR_PRESETS.filter((preset) => preset.id !== "noir");
  }
  return [...ATELIER_CITY_COLOR_PRESETS];
}

export function fallbackAtelierCityColorForModel(modelId: string): string {
  if (modelId === "tee-noir") return "#ffffff";
  return "#000000";
}

export function isAtelierCityColorAllowedForModel(modelId: string, hex: string): boolean {
  const normalized = normalizeAtelierCityColor(hex);
  if (!normalized) return false;
  if (modelId === "tee-blanc" && normalized === "#ffffff") return false;
  if (modelId === "tee-noir" && normalized === "#000000") return false;
  return true;
}

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function normalizeAtelierCityColor(value: string): string {
  const trimmed = value.trim();
  if (!HEX_COLOR_RE.test(trimmed)) return "";
  if (trimmed.length === 4) {
    const r = trimmed[1]!;
    const g = trimmed[2]!;
    const b = trimmed[3]!;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return trimmed.toLowerCase();
}

function hexLuminance(hex: string): number {
  const normalized = normalizeAtelierCityColor(hex);
  if (!normalized) return 0;
  const body = normalized.slice(1, 7);
  const r = Number.parseInt(body.slice(0, 2), 16) / 255;
  const g = Number.parseInt(body.slice(2, 4), 16) / 255;
  const b = Number.parseInt(body.slice(4, 6), 16) / 255;
  const linear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

export function resolveAtelierCityTextStyle(
  model: Pick<AtelierCustomModel, "previewTextStyle" | "previewCityColor">,
  colorOverride?: string,
): { className: string; style: CSSProperties } {
  const fromOverride = colorOverride !== undefined ? normalizeAtelierCityColor(colorOverride) : "";
  const fromModel = normalizeAtelierCityColor(model.previewCityColor);
  const hex = fromOverride || fromModel;
  if (hex) {
    const light = hexLuminance(hex) > 0.62;
    return {
      className: "dingry-personalize-city",
      style: {
        color: hex,
        textShadow: light ? "0 1px 3px rgba(0, 0, 0, 0.55)" : undefined,
      },
    };
  }
  return { className: previewTextStyleClass(model.previewTextStyle), style: {} };
}

export const SHOP_ATELIER_CUSTOM_DEFAULT: AdminAtelierCustomConfig = {
  enabled: true,
  updatedAt: "",
  suggestedCities: [...CUSTOM_BANNER_SUGGESTED_CITIES],
  models: [
    {
      id: "tee-blanc",
      label: "T-shirt blanc",
      catalogRef: "#11",
      productId: 11,
      enabled: true,
      basePriceEur: 35,
      sizes: ATELIER_CUSTOM_SIZES,
      previewImageUrl: DINGRY_PRODUCT_MEDIA.teeWhiteRecto,
      swatch: "#f4f4f2",
      swatchText: "#161616",
      cityTop: "44%",
      citySize: "clamp(0.38rem, 1.85vw, 0.56rem)",
      previewTextStyle: "dark",
      previewCityColor: "#000000",
    },
    {
      id: "tee-noir",
      label: "T-shirt noir",
      catalogRef: "#25",
      productId: 21,
      enabled: true,
      basePriceEur: 35,
      sizes: ATELIER_CUSTOM_SIZES,
      previewImageUrl: DINGRY_PRODUCT_MEDIA.teeBlackRecto,
      swatch: "#161616",
      swatchText: "#ffffff",
      cityTop: "44%",
      citySize: "clamp(0.38rem, 1.85vw, 0.56rem)",
      previewTextStyle: "light",
      previewCityColor: "#ffffff",
    },
    {
      id: "hoodie-noir-paris",
      label: "Hoodie noir",
      catalogRef: "#25",
      productId: 25,
      enabled: true,
      basePriceEur: 80,
      sizes: ATELIER_CUSTOM_SIZES,
      previewImageUrl: DINGRY_PRODUCT_MEDIA.hoodieParisBlackRecto,
      swatch: "#161616",
      swatchText: "#ffffff",
      cityTop: "46%",
      citySize: "clamp(0.38rem, 1.85vw, 0.56rem)",
      previewTextStyle: "light",
      previewCityColor: "#ffffff",
    },
    {
      id: "hoodie-gris",
      label: "Hoodie gris",
      catalogRef: "#27",
      productId: 27,
      enabled: true,
      basePriceEur: 80,
      sizes: ATELIER_CUSTOM_SIZES,
      previewImageUrl: DINGRY_PRODUCT_MEDIA.hoodieParisGreyRecto,
      swatch: "#b8b8b8",
      swatchText: "#161616",
      cityTop: "46%",
      citySize: "clamp(0.38rem, 1.85vw, 0.56rem)",
      previewTextStyle: "dark",
      previewCityColor: "#000000",
    },
    {
      id: "hoodie-blanc",
      label: "Hoodie blanc",
      catalogRef: "#35",
      productId: 35,
      enabled: true,
      basePriceEur: 80,
      sizes: ATELIER_CUSTOM_SIZES,
      previewImageUrl: DINGRY_PRODUCT_MEDIA.hoodieParisWhiteRecto,
      swatch: "#f4f4f2",
      swatchText: "#161616",
      cityTop: "46%",
      citySize: "clamp(0.38rem, 1.85vw, 0.56rem)",
      previewTextStyle: "dark",
      previewCityColor: "#000000",
    },
    {
      id: "hoodie-chocolat",
      label: "Hoodie chocolat",
      catalogRef: "#29",
      productId: 29,
      enabled: true,
      basePriceEur: 80,
      sizes: ATELIER_CUSTOM_SIZES,
      previewImageUrl: DINGRY_PRODUCT_MEDIA.hoodieRoyalBlueRecto,
      swatch: "#4a3228",
      swatchText: "#ffffff",
      cityTop: "46%",
      citySize: "clamp(0.38rem, 1.85vw, 0.56rem)",
      previewTextStyle: "light",
      previewCityColor: "#ffffff",
    },
    {
      id: "hoodie-vert",
      label: "Hoodie vert",
      catalogRef: "#7",
      productId: 7,
      enabled: true,
      basePriceEur: 80,
      sizes: ATELIER_CUSTOM_SIZES,
      previewImageUrl: IMAGES.hoodie7,
      swatch: "#1f4d2a",
      swatchText: "#ffffff",
      cityTop: "46%",
      citySize: "clamp(0.38rem, 1.85vw, 0.56rem)",
      previewTextStyle: "light",
      previewCityColor: "#ffffff",
    },
  ],
};

/** Tees personnalisables vitrine (#11 blanc, #21 noir — pas fiche perso #24). */
export const SHOP_ATELIER_ALLOWED_PRODUCT_IDS = new Set<number>([11, 21]);

const ATELIER_EXCLUDED_PRODUCT_IDS = new Set<number>([24]);

function isAtelierTunnelShopCategory(category: string): boolean {
  return (
    isShopTeeCategory(category) ||
    category === "Hoodie" ||
    category === "Hoodie zippé" ||
    category === "Sweats"
  );
}

export function isShopAtelierModel(model: AtelierCustomModel): boolean {
  if (ATELIER_EXCLUDED_PRODUCT_IDS.has(model.productId)) return false;
  if (SHOP_ATELIER_ALLOWED_PRODUCT_IDS.has(model.productId)) return true;
  if (DINGRY_TEE_PRODUCT_IDS.has(model.productId)) return true;
  if (DINGRY_SWEAT_PRODUCT_IDS.has(model.productId)) return true;
  const seed = PRODUCTS.find((p) => p.id === model.productId);
  if (!seed) return false;
  const shopCat = String(resolveShopCategory(seed.id, seed.category));
  return isAtelierTunnelShopCategory(shopCat);
}

export function findAtelierModelForProduct(
  config: ShopAtelierCustomConfig,
  productId: number,
): AtelierCustomModel | undefined {
  return enabledAtelierModels(config).find((m) => m.productId === productId);
}

export function isShopProductAtelierEligible(
  product: Pick<ShopProduct, "id" | "category">,
  config: ShopAtelierCustomConfig,
): boolean {
  if (!config.enabled) return false;
  if (ATELIER_EXCLUDED_PRODUCT_IDS.has(product.id)) return false;
  const shopCat = String(resolveShopCategory(product.id, String(product.category)));
  if (!isAtelierTunnelShopCategory(shopCat)) return false;
  if (findAtelierModelForProduct(config, product.id)) return true;
  return enabledAtelierModels(config).length > 0;
}

export function enabledAtelierModels(config: ShopAtelierCustomConfig): AtelierCustomModel[] {
  if (!config.enabled) return [];
  return config.models.filter((model) => model.enabled && isShopAtelierModel(model));
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

export type AtelierModelPickerGroupId = "tees" | "hoodies" | "sweats";

const ATELIER_MODEL_GROUP_LABEL: Record<AtelierModelPickerGroupId, string> = {
  tees: "T-shirts",
  hoodies: "Hoodies",
  sweats: "Sweats",
};

export function atelierModelPickerGroupForProduct(productId: number): AtelierModelPickerGroupId {
  const seed = PRODUCTS.find((p) => p.id === productId);
  if (!seed) {
    if (DINGRY_TEE_PRODUCT_IDS.has(productId)) return "tees";
    if (DINGRY_SWEAT_PRODUCT_IDS.has(productId)) return "sweats";
    return "hoodies";
  }
  const shopCat = String(resolveShopCategory(seed.id, seed.category));
  if (isShopTeeCategory(shopCat)) return "tees";
  if (shopCat === "Sweats" || seed.category === "Crewnecks") return "sweats";
  return "hoodies";
}

export type AtelierModelPickerGroup = {
  id: AtelierModelPickerGroupId;
  label: string;
  models: AtelierCustomModel[];
};

export function groupAtelierModelsForPicker(models: readonly AtelierCustomModel[]): AtelierModelPickerGroup[] {
  const buckets: Record<AtelierModelPickerGroupId, AtelierCustomModel[]> = {
    tees: [],
    hoodies: [],
    sweats: [],
  };
  for (const model of models) {
    buckets[atelierModelPickerGroupForProduct(model.productId)].push(model);
  }
  const order: AtelierModelPickerGroupId[] = ["tees", "hoodies", "sweats"];
  return order
    .filter((id) => buckets[id].length > 0)
    .map((id) => ({
      id,
      label: ATELIER_MODEL_GROUP_LABEL[id],
      models: buckets[id]!,
    }));
}

const RETIRED_ATELIER_CITIES = new Set(["MADININA", "MILAN"]);

function mergeAtelierSuggestedCities(stored: readonly string[]): readonly string[] {
  const ordered = [...CUSTOM_BANNER_SUGGESTED_CITIES];
  const seen = new Set(ordered);
  for (const raw of stored) {
    const city = raw.trim().toUpperCase();
    if (!city || seen.has(city) || RETIRED_ATELIER_CITIES.has(city)) continue;
    seen.add(city);
    ordered.push(city);
  }
  return ordered.filter((city) => !RETIRED_ATELIER_CITIES.has(city));
}

export function sanitizeAtelierPreviewImageUrl(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (/^(https?:\/\/|\/)/i.test(trimmed)) return trimmed;
  return fallback;
}

export function sanitizeAtelierCityTop(value: string, fallback: string): string {
  const match = /^([\d.]+)\s*%$/.exec(value.trim());
  if (!match) return fallback;
  return formatCityTopPercent(parseCityTopPercent(value));
}

export function sanitizeAtelierCitySize(value: string, fallback: string): string {
  if (!value.trim().toLowerCase().includes("clamp(")) return fallback;
  return formatCitySizeClamp(parseCitySizeMaxRem(value));
}

function mergeAtelierModelsWithShopDefaults(stored: readonly AtelierCustomModel[]): AtelierCustomModel[] {
  const byId = new Map<string, AtelierCustomModel>();
  for (const model of SHOP_ATELIER_CUSTOM_DEFAULT.models) {
    byId.set(model.id, model);
  }
  for (const model of stored) {
    const id = model.id.trim();
    if (!id) continue;
    byId.set(id, model);
  }
  return [...byId.values()].filter((model) => model.enabled && isShopAtelierModel(model));
}

const LEGACY_TEE_WHITE_RECTO_PREVIEW =
  "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/teeWhiteRecto/1794331780641-x720d5-teeWhiteRecto.webp";
const LEGACY_TEE_BLACK_RECTO_PREVIEW =
  "https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev/dingry/legacy/teeBlackRecto/1794331777613-kf27km-teeBlackRecto.webp";

function isLegacyAtelierPreview(modelId: string, url: string): boolean {
  if (modelId === "tee-blanc") {
    return url === LEGACY_TEE_WHITE_RECTO_PREVIEW || url.includes("/teeWhiteRecto/");
  }
  if (modelId === "tee-noir") {
    return url === LEGACY_TEE_BLACK_RECTO_PREVIEW || url.includes("/teeBlackRecto/");
  }
  return false;
}

function atelierSizesMatchLegacy(sizes: readonly string[]): boolean {
  if (sizes.length !== LEGACY_ATELIER_SIZES.length) return false;
  return sizes.every((size, index) => size === LEGACY_ATELIER_SIZES[index]);
}

function upgradeAtelierModelPreview(model: AtelierCustomModel): AtelierCustomModel {
  const fallback = SHOP_ATELIER_CUSTOM_DEFAULT.models.find((entry) => entry.id === model.id);
  if (!fallback || (model.id !== "tee-blanc" && model.id !== "tee-noir")) return model;
  const useLocalPreview = isLegacyAtelierPreview(model.id, model.previewImageUrl);
  const sizes = atelierSizesMatchLegacy(model.sizes) ? [...ATELIER_CUSTOM_SIZES] : model.sizes;
  const storedColor = normalizeAtelierCityColor(model.previewCityColor);
  const teeNoirLegacyGold = model.id === "tee-noir" && storedColor === "#d4af37";
  const storedColorDisallowed =
    Boolean(storedColor && !isAtelierCityColorAllowedForModel(model.id, storedColor)) ||
    teeNoirLegacyGold;
  return {
    ...model,
    sizes,
    previewImageUrl: useLocalPreview ? fallback.previewImageUrl : model.previewImageUrl,
    cityTop: useLocalPreview ? fallback.cityTop : model.cityTop,
    citySize: useLocalPreview ? fallback.citySize : model.citySize,
    previewTextStyle:
      model.id === "tee-blanc" && useLocalPreview
        ? "dark"
        : storedColorDisallowed
          ? fallback.previewTextStyle
          : model.previewTextStyle,
    previewCityColor: useLocalPreview || storedColorDisallowed
      ? fallback.previewCityColor
      : storedColor || fallback.previewCityColor,
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
    models: (() => {
      const merged =
        stored.models.length > 0
          ? mergeAtelierModelsWithShopDefaults(stored.models)
          : [...SHOP_ATELIER_CUSTOM_DEFAULT.models];
      const resolved = merged.length > 0 ? merged : [...SHOP_ATELIER_CUSTOM_DEFAULT.models];
      return resolved.map(upgradeAtelierModelPreview);
    })(),
    suggestedCities: mergeAtelierSuggestedCities(stored.suggestedCities),
  };
}
