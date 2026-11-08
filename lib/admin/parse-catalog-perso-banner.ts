type ParseResult = {
  error?: string;
  fields: {
    enabled?: boolean;
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
  };
};

const MAX_EYEBROW = 64;
const MAX_TITLE = 120;
const MAX_SUBTITLE = 160;
const MAX_CTA = 40;

function readString(value: FormDataEntryValue | unknown): string {
  if (typeof value === "string") return value.trim();
  return "";
}

function readBoolean(value: FormDataEntryValue | unknown): boolean | undefined {
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "1" || v === "true" || v === "on" || v === "yes") return true;
    if (v === "0" || v === "false" || v === "off" || v === "no") return false;
  }
  return undefined;
}

function cap(value: string, max: number, label: string): string | { error: string } {
  if (value.length > max) return { error: `${label} : ${max} caractères max.` };
  return value;
}

export function parseCatalogPersoBannerFields(
  source: FormData | Record<string, unknown>,
  options?: { partial?: boolean },
): ParseResult {
  const partial = options?.partial ?? false;
  const get = (key: string): FormDataEntryValue | unknown =>
    source instanceof FormData ? source.get(key) : source[key];

  const enabled = readBoolean(get("enabled"));
  const eyebrowRaw = readString(get("eyebrow"));
  const titleRaw = readString(get("title"));
  const subtitleRaw = readString(get("subtitle"));
  const ctaRaw = readString(get("ctaLabel"));

  if (!partial) {
    if (!eyebrowRaw) return { error: "Le sur-titre est requis.", fields: {} };
    if (!titleRaw) return { error: "Le titre est requis.", fields: {} };
    if (!subtitleRaw) return { error: "Le sous-titre est requis.", fields: {} };
    if (!ctaRaw) return { error: "Le libellé du bouton est requis.", fields: {} };
  }

  if (eyebrowRaw) {
    const capped = cap(eyebrowRaw, MAX_EYEBROW, "Sur-titre");
    if (typeof capped === "object") return { error: capped.error, fields: {} };
  }
  if (titleRaw) {
    const capped = cap(titleRaw, MAX_TITLE, "Titre");
    if (typeof capped === "object") return { error: capped.error, fields: {} };
  }
  if (subtitleRaw) {
    const capped = cap(subtitleRaw, MAX_SUBTITLE, "Sous-titre");
    if (typeof capped === "object") return { error: capped.error, fields: {} };
  }
  if (ctaRaw) {
    const capped = cap(ctaRaw, MAX_CTA, "Bouton");
    if (typeof capped === "object") return { error: capped.error, fields: {} };
  }

  return {
    fields: {
      ...(enabled !== undefined ? { enabled } : {}),
      ...(eyebrowRaw ? { eyebrow: eyebrowRaw } : {}),
      ...(titleRaw ? { title: titleRaw } : {}),
      ...(subtitleRaw ? { subtitle: subtitleRaw } : {}),
      ...(ctaRaw ? { ctaLabel: ctaRaw } : {}),
    },
  };
}
