import { isR2PublicUrl } from "@/lib/r2/config";

export type PreuploadedImagePayload = {
  imageUrl: string;
  blobUrl: string;
  blobPathname: string | null;
};

function readPair(
  source: FormData | Record<string, unknown>,
  urlKey: string,
  pathKey: string,
): PreuploadedImagePayload | null {
  const url =
    source instanceof FormData
      ? String(source.get(urlKey) ?? "").trim()
      : String((source as Record<string, unknown>)[urlKey] ?? "").trim();
  if (!url || !isR2PublicUrl(url)) return null;
  const pathname =
    source instanceof FormData
      ? String(source.get(pathKey) ?? "").trim()
      : String((source as Record<string, unknown>)[pathKey] ?? "").trim();
  return {
    imageUrl: url,
    blobUrl: url,
    blobPathname: pathname || null,
  };
}

export function preuploadedRectoFromForm(source: FormData | Record<string, unknown>): PreuploadedImagePayload | null {
  return readPair(source, "imageUrl", "imageBlobPathname");
}

export function preuploadedVersoFromForm(source: FormData | Record<string, unknown>): PreuploadedImagePayload | null {
  return readPair(source, "imageBackUrl", "imageBackBlobPathname");
}
