import type { AdminAtelierCustomConfig, AtelierCustomModel } from "@/lib/atelier-custom-config";
import { SHOP_ATELIER_CUSTOM_DEFAULT } from "@/lib/atelier-custom-config";
import { SIZES } from "@/lib/shop-data";

function parseModel(raw: unknown, fallback: AtelierCustomModel): AtelierCustomModel {
  if (!raw || typeof raw !== "object") return fallback;
  const row = raw as Record<string, unknown>;
  const sizesRaw = Array.isArray(row.sizes) ? row.sizes : fallback.sizes;
  const sizes = sizesRaw
    .map((value) => (typeof value === "string" ? value.trim().toUpperCase() : ""))
    .filter((value) => value.length > 0);
  const productId = Number(row.productId);
  const basePriceEur = Number(row.basePriceEur);
  const previewTextStyle = row.previewTextStyle;
  const styleOk =
    previewTextStyle === "light" || previewTextStyle === "gold" || previewTextStyle === "dark"
      ? previewTextStyle
      : fallback.previewTextStyle;

  return {
    id: typeof row.id === "string" && row.id.trim() ? row.id.trim() : fallback.id,
    label: typeof row.label === "string" && row.label.trim() ? row.label.trim() : fallback.label,
    catalogRef:
      typeof row.catalogRef === "string" && row.catalogRef.trim() ? row.catalogRef.trim() : fallback.catalogRef,
    productId: Number.isFinite(productId) && productId > 0 ? Math.floor(productId) : fallback.productId,
    enabled: row.enabled === undefined ? fallback.enabled : Boolean(row.enabled),
    basePriceEur:
      Number.isFinite(basePriceEur) && basePriceEur >= 0 ? Math.round(basePriceEur) : fallback.basePriceEur,
    sizes: sizes.length > 0 ? sizes : [...SIZES],
    previewImageUrl:
      typeof row.previewImageUrl === "string" && row.previewImageUrl.trim()
        ? row.previewImageUrl.trim()
        : fallback.previewImageUrl,
    swatch: typeof row.swatch === "string" && row.swatch.trim() ? row.swatch.trim() : fallback.swatch,
    swatchText:
      typeof row.swatchText === "string" && row.swatchText.trim() ? row.swatchText.trim() : fallback.swatchText,
    cityTop: typeof row.cityTop === "string" && row.cityTop.trim() ? row.cityTop.trim() : fallback.cityTop,
    citySize: typeof row.citySize === "string" && row.citySize.trim() ? row.citySize.trim() : fallback.citySize,
    previewTextStyle: styleOk,
  };
}

export function parseAtelierCustomJson(json: string): AdminAtelierCustomConfig | null {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") return null;
    const row = parsed as Record<string, unknown>;
    const defaults = SHOP_ATELIER_CUSTOM_DEFAULT;
    const modelsRaw = Array.isArray(row.models) ? row.models : [];
    const models = defaults.models.map((fallback, index) =>
      parseModel(modelsRaw[index] ?? modelsRaw.find((m) => {
        if (!m || typeof m !== "object") return false;
        return (m as Record<string, unknown>).id === fallback.id;
      }), fallback),
    );
    const extraModels = modelsRaw
      .filter((m) => {
        if (!m || typeof m !== "object") return false;
        const id = (m as Record<string, unknown>).id;
        return typeof id === "string" && !defaults.models.some((d) => d.id === id);
      })
      .map((m, index) => parseModel(m, { ...defaults.models[0]!, id: `custom-${index + 1}`, label: "Modèle custom" }));

    const citiesRaw = Array.isArray(row.suggestedCities) ? row.suggestedCities : defaults.suggestedCities;
    const suggestedCities = citiesRaw
      .map((city) => (typeof city === "string" ? city.trim().toUpperCase() : ""))
      .filter((city) => city.length > 0);

    return {
      enabled: row.enabled === undefined ? defaults.enabled : Boolean(row.enabled),
      models: [...models, ...extraModels],
      suggestedCities: suggestedCities.length > 0 ? suggestedCities : [...defaults.suggestedCities],
      updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : "",
    };
  } catch {
    return null;
  }
}

export function serializeAtelierCustomConfig(config: AdminAtelierCustomConfig): string {
  return JSON.stringify({
    enabled: config.enabled,
    models: config.models,
    suggestedCities: config.suggestedCities,
    updatedAt: config.updatedAt,
  });
}
