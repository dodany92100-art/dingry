/** Encode le pathname pour `<img src>` / `next/image` (espaces R2, noms WhatsApp, etc.). */
export function browserSafeImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || !trimmed.includes(" ")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    parsed.pathname = parsed.pathname
      .split("/")
      .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
      .join("/");
    return parsed.href;
  } catch {
    return trimmed.replace(/ /g, "%20");
  }
}
