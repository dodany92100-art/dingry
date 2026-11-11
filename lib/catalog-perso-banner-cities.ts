import {
  clampBannerFocusPercent,
  DEFAULT_PERSO_BANNER_FOCUS_X,
  DEFAULT_PERSO_BANNER_FOCUS_Y,
} from "@/lib/catalog-perso-banner-focus";
import { CUSTOM_BANNER_CITIES } from "@/lib/custom-city-banner";

export const PERSO_BANNER_CITY_IDS = CUSTOM_BANNER_CITIES.map((city) => city.id);

export type PersoBannerCityId = (typeof PERSO_BANNER_CITY_IDS)[number];

/** Ville de référence pour `image_url` CRM et onglet atelier par défaut. */
export const DEFAULT_PERSO_BANNER_CITY_ID = "marseille" as const satisfies PersoBannerCityId;

/** Switch visuel Paris / Marseille / Lyon sur le bandeau atelier (admin inchangé). */
export const ATELIER_BANNER_CITY_SWITCH_ENABLED = false;

export type PersoBannerCityVisual = {
  imageUrl: string;
  blobPathname: string | null;
  imageFocusX: number;
  imageFocusY: number;
};

export type PersoBannerCityVisuals = Partial<Record<PersoBannerCityId, PersoBannerCityVisual>>;

const LEGACY_FOCUS_PREFIX = "dingry:image-focus:";
const LINK_PREFIX = "dingry:perso-banner:";

type LinkCityCompact = {
  u: string;
  bp?: string | null;
  fx: number;
  fy: number;
};

type LinkPayloadV1 = {
  v: 1;
  fx: number;
  fy: number;
  c?: Partial<Record<PersoBannerCityId, LinkCityCompact>>;
};

function emptyCityVisuals(): PersoBannerCityVisuals {
  return {};
}

function normalizeCityVisual(raw: LinkCityCompact | undefined): PersoBannerCityVisual | undefined {
  const imageUrl = raw?.u?.trim() ?? "";
  if (!imageUrl) return undefined;
  return {
    imageUrl,
    blobPathname: raw?.bp?.trim() ? raw.bp.trim() : null,
    imageFocusX: clampBannerFocusPercent(raw?.fx ?? DEFAULT_PERSO_BANNER_FOCUS_X),
    imageFocusY: clampBannerFocusPercent(raw?.fy ?? DEFAULT_PERSO_BANNER_FOCUS_Y),
  };
}

export function parsePersoBannerLinkMeta(linkUrl: string | null | undefined): {
  imageFocusX: number;
  imageFocusY: number;
  cityVisuals: PersoBannerCityVisuals;
} {
  const trimmed = linkUrl?.trim() ?? "";
  if (trimmed.startsWith(LINK_PREFIX)) {
    const raw = trimmed.slice(LINK_PREFIX.length);
    try {
      const payload = JSON.parse(decodeURIComponent(raw)) as LinkPayloadV1;
      if (payload?.v !== 1) {
        return {
          imageFocusX: DEFAULT_PERSO_BANNER_FOCUS_X,
          imageFocusY: DEFAULT_PERSO_BANNER_FOCUS_Y,
          cityVisuals: emptyCityVisuals(),
        };
      }
      const cityVisuals: PersoBannerCityVisuals = {};
      const compact = payload.c ?? {};
      for (const id of PERSO_BANNER_CITY_IDS) {
        const visual = normalizeCityVisual(compact[id]);
        if (visual) cityVisuals[id] = visual;
      }
      return {
        imageFocusX: clampBannerFocusPercent(payload.fx),
        imageFocusY: clampBannerFocusPercent(payload.fy),
        cityVisuals,
      };
    } catch {
      return {
        imageFocusX: DEFAULT_PERSO_BANNER_FOCUS_X,
        imageFocusY: DEFAULT_PERSO_BANNER_FOCUS_Y,
        cityVisuals: emptyCityVisuals(),
      };
    }
  }

  if (trimmed.startsWith(LEGACY_FOCUS_PREFIX)) {
    const [xs, ys] = trimmed.slice(LEGACY_FOCUS_PREFIX.length).split(",");
    const x = Number(xs);
    const y = Number(ys);
    return {
      imageFocusX: Number.isFinite(x) ? clampBannerFocusPercent(x) : DEFAULT_PERSO_BANNER_FOCUS_X,
      imageFocusY: Number.isFinite(y) ? clampBannerFocusPercent(y) : DEFAULT_PERSO_BANNER_FOCUS_Y,
      cityVisuals: emptyCityVisuals(),
    };
  }

  return {
    imageFocusX: DEFAULT_PERSO_BANNER_FOCUS_X,
    imageFocusY: DEFAULT_PERSO_BANNER_FOCUS_Y,
    cityVisuals: emptyCityVisuals(),
  };
}

export function encodePersoBannerLink(
  focusX: number,
  focusY: number,
  cityVisuals: PersoBannerCityVisuals | undefined,
): string {
  const fx = clampBannerFocusPercent(focusX);
  const fy = clampBannerFocusPercent(focusY);
  const c: Partial<Record<PersoBannerCityId, LinkCityCompact>> = {};
  for (const id of PERSO_BANNER_CITY_IDS) {
    const visual = cityVisuals?.[id];
    const url = visual?.imageUrl?.trim() ?? "";
    if (!url || !visual) continue;
    c[id] = {
      u: url,
      bp: visual.blobPathname,
      fx: clampBannerFocusPercent(visual.imageFocusX),
      fy: clampBannerFocusPercent(visual.imageFocusY),
    };
  }
  const payload: LinkPayloadV1 = { v: 1, fx, fy, ...(Object.keys(c).length > 0 ? { c } : {}) };
  return `${LINK_PREFIX}${encodeURIComponent(JSON.stringify(payload))}`;
}

export function persoBannerCityVisualForTab(
  cityId: PersoBannerCityId,
  cityVisuals: PersoBannerCityVisuals | undefined,
  fallback: { imageUrl: string; imageFocusX: number; imageFocusY: number },
): { imageUrl: string; imageFocusX: number; imageFocusY: number } {
  const city = cityVisuals?.[cityId];
  if (city?.imageUrl?.trim()) {
    return {
      imageUrl: city.imageUrl.trim(),
      imageFocusX: city.imageFocusX,
      imageFocusY: city.imageFocusY,
    };
  }
  return {
    imageUrl: fallback.imageUrl,
    imageFocusX: fallback.imageFocusX,
    imageFocusY: fallback.imageFocusY,
  };
}

export function persoBannerCityFormPrefix(cityId: PersoBannerCityId): string {
  return `city_${cityId}`;
}

/** Aligne le visuel principal Supabase sur Marseille quand elle est renseignée. */
export function primaryPersoBannerFromCityVisuals(
  cityVisuals: PersoBannerCityVisuals,
  fallback: {
    imageUrl: string;
    blobPathname: string | null;
    imageFocusX: number;
    imageFocusY: number;
  },
): { imageUrl: string; blobPathname: string | null; imageFocusX: number; imageFocusY: number } {
  const marseille = cityVisuals[DEFAULT_PERSO_BANNER_CITY_ID];
  const url = marseille?.imageUrl?.trim();
  if (!url || !marseille) return fallback;
  return {
    imageUrl: url,
    blobPathname: marseille.blobPathname,
    imageFocusX: marseille.imageFocusX,
    imageFocusY: marseille.imageFocusY,
  };
}
