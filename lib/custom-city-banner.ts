import { personalizationPreviewLabel } from "@/lib/shop-view";

export type CustomBannerCity = {
  id: string;
  /** Libellé du sélecteur (ex. « Marseille »). */
  label: string;
  /** Photo de fond — null tant qu’elle n’est pas sur R2. */
  background: string | null;
  /** Valeur atelier / datalist (ex. « MARSEILLE »). */
  suggestion: string;
};

/** Villes bandeau atelier + suggestions modale (une seule source). */
export const CUSTOM_BANNER_CITIES: readonly CustomBannerCity[] = [
  { id: "marseille", label: "Marseille", background: null, suggestion: "MARSEILLE" },
  { id: "paris", label: "Paris", background: null, suggestion: "PARIS" },
  { id: "lyon", label: "Lyon", background: null, suggestion: "LYON" },
  { id: "madinina", label: "Madinina", background: null, suggestion: "MADININA" },
  { id: "milan", label: "Milan", background: null, suggestion: "MILAN" },
];

export const CUSTOM_BANNER_SUGGESTED_CITIES: readonly string[] = CUSTOM_BANNER_CITIES.map(
  (city) => city.suggestion,
);

export const CUSTOM_BANNER_COPY = {
  eyebrow: "CUSTOM • CONFIGURATEUR",
  title: "À chaque ville sa Dingry",
  subtitle: "Personnalise ton tee-shirt avec le nom de ta ville.",
  cityField: "Choisis ta ville",
  citySearchPlaceholder: "Rechercher une ville…",
  cta: "Personnaliser →",
} as const;

/** Correspondance ville bandeau depuis la saisie (label, suggestion ou préfixe). */
export function matchBannerCityFromQuery(query: string): CustomBannerCity | null {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;
  const exact = CUSTOM_BANNER_CITIES.find(
    (city) =>
      city.id === normalized ||
      city.label.toLowerCase() === normalized ||
      city.suggestion.toLowerCase() === normalized,
  );
  if (exact) return exact;
  return (
    CUSTOM_BANNER_CITIES.find(
      (city) =>
        city.label.toLowerCase().startsWith(normalized) ||
        city.suggestion.toLowerCase().startsWith(normalized),
    ) ?? null
  );
}

/** Texte transmis au configurateur (majuscules, 28 car. max). */
export function bannerConfiguratorInitialLabel(cityLabel: string): string {
  return personalizationPreviewLabel(cityLabel);
}

/** Fond : ville → visuel admin → aucun (dégradé CSS). */
export function resolveCustomBannerBackground(
  cityBackground: string | null | undefined,
  adminImageUrl: string,
): string | null {
  const fromCity = cityBackground?.trim();
  if (fromCity) return fromCity;
  const fromAdmin = adminImageUrl.trim();
  if (fromAdmin) return fromAdmin;
  return null;
}
