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
