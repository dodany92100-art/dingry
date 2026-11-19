const PARIS = "Europe/Paris";

/** Libellé date/heure du dernier build (Preview / prod Vercel ou dev local). */
export function formatCrmBuildLabel(): string {
  const raw = (process.env.NEXT_PUBLIC_CRM_BUILD_AT ?? "").trim();
  if (!raw) return "";
  const parsed = Date.parse(raw);
  if (!Number.isFinite(parsed)) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: PARIS,
  }).format(parsed);
}

export type CrmBuildLabelHeaderParts = {
  date: string;
  time: string;
};

/** Bandeau admin : date courte + heure discrète. */
export function formatCrmBuildLabelHeaderParts(): CrmBuildLabelHeaderParts | null {
  const raw = (process.env.NEXT_PUBLIC_CRM_BUILD_AT ?? "").trim();
  if (!raw) return null;
  const parsed = Date.parse(raw);
  if (!Number.isFinite(parsed)) return null;
  const date = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: PARIS,
  })
    .format(parsed)
    .replace(/\./g, "");
  const time = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: PARIS,
  }).format(parsed);
  return { date, time };
}
