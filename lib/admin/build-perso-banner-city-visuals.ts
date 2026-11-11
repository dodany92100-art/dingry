type UploadedAdminImage = { imageUrl: string; blobUrl: string | null; blobPathname: string | null };
import { isR2PublicUrl } from "@/lib/r2/config";
import {
  persoBannerCityFormPrefix,
  PERSO_BANNER_CITY_IDS,
  type PersoBannerCityId,
  type PersoBannerCityVisual,
  type PersoBannerCityVisuals,
} from "@/lib/catalog-perso-banner-cities";
import { clampBannerFocusPercent, DEFAULT_PERSO_BANNER_FOCUS_X, DEFAULT_PERSO_BANNER_FOCUS_Y } from "@/lib/catalog-perso-banner-focus";

function readString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function persistedCityImage(
  formData: FormData,
  cityId: PersoBannerCityId,
): UploadedAdminImage | null {
  const prefix = persoBannerCityFormPrefix(cityId);
  const imageUrl = readString(formData, `${prefix}_imageUrl`);
  if (!imageUrl || !isR2PublicUrl(imageUrl)) return null;
  const blobPathname = readString(formData, `${prefix}_imageBlobPathname`);
  return { imageUrl, blobUrl: imageUrl, blobPathname: blobPathname || null };
}

function preuploadedCityImage(
  formData: FormData,
  cityId: PersoBannerCityId,
): UploadedAdminImage | null {
  const prefix = persoBannerCityFormPrefix(cityId);
  const imageUrl = readString(formData, `${prefix}_preuploadImageUrl`);
  if (!imageUrl || !isR2PublicUrl(imageUrl)) return null;
  const blobPathname = readString(formData, `${prefix}_preuploadBlobPathname`);
  return { imageUrl, blobUrl: imageUrl, blobPathname: blobPathname || null };
}

export type CityVisualBuildInput = {
  formData: FormData;
  previous: PersoBannerCityVisuals | undefined;
  uploadCity: (file: File, cityId: PersoBannerCityId) => Promise<UploadedAdminImage>;
};

export async function buildPersoBannerCityVisuals(
  input: CityVisualBuildInput,
): Promise<PersoBannerCityVisuals> {
  const next: PersoBannerCityVisuals = { ...(input.previous ?? {}) };

  for (const cityId of PERSO_BANNER_CITY_IDS) {
    const prefix = persoBannerCityFormPrefix(cityId);
    if (readString(input.formData, `${prefix}_clear`) === "true") {
      delete next[cityId];
      continue;
    }
    const focusX = clampBannerFocusPercent(
      Number(readString(input.formData, `${prefix}_imageFocusX`) || DEFAULT_PERSO_BANNER_FOCUS_X),
    );
    const focusY = clampBannerFocusPercent(
      Number(readString(input.formData, `${prefix}_imageFocusY`) || DEFAULT_PERSO_BANNER_FOCUS_Y),
    );

    const fileEntry = input.formData.get(`${prefix}_image`);
    const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : undefined;

    let imageUrl = "";
    let blobPathname: string | null = null;

    if (file) {
      const uploaded = await input.uploadCity(file, cityId);
      imageUrl = uploaded.imageUrl;
      blobPathname = uploaded.blobPathname;
    } else {
      const pre = preuploadedCityImage(input.formData, cityId);
      const persisted = persistedCityImage(input.formData, cityId);
      const source = pre ?? persisted ?? null;
      if (source?.imageUrl) {
        imageUrl = source.imageUrl;
        blobPathname = source.blobPathname;
      } else {
        const prior = input.previous?.[cityId];
        if (prior?.imageUrl?.trim()) {
          imageUrl = prior.imageUrl.trim();
          blobPathname = prior.blobPathname;
        }
      }
    }

    if (!imageUrl.trim()) {
      delete next[cityId];
      continue;
    }

    const visual: PersoBannerCityVisual = {
      imageUrl: imageUrl.trim(),
      blobPathname,
      imageFocusX: focusX,
      imageFocusY: focusY,
    };
    next[cityId] = visual;
  }

  return next;
}
