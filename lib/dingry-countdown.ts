/** Cible compte à rebours (Europe/Paris) — partagé teaser + bannière boutique. */
export {
  DINGRY_TEASER_OPENING_AT as DINGRY_COUNTDOWN_TARGET_AT,
  DINGRY_TEASER_OPENING_LABEL as DINGRY_COUNTDOWN_LABEL,
} from "@/lib/dingry-teaser-opening";

/** Bandeau / page construction (compteur simple). */
export const DINGRY_SITE_CONSTRUCTION_LABEL = "Site en construction.";

/** Message accueil teaser — un bloc, retours à la ligne naturels. */
export const DINGRY_TEASER_MESSAGE =
  "On dit que plus c'est long, plus c'est bon… et on compte bien vous le prouver ! On prend un peu plus de temps que prévu, mais c'est pour vous préparer une vraie expérience DINGRY. Merci pour votre patience et votre confiance.";

/** @deprecated {@link DINGRY_TEASER_MESSAGE} */
export const DINGRY_TEASER_MESSAGE_PARAGRAPHS = [DINGRY_TEASER_MESSAGE] as const;

export const COUNTDOWN_UNITS = [
  { key: "days", label: "J", seconds: 86_400 },
  { key: "hours", label: "H", seconds: 3_600 },
  { key: "minutes", label: "M", seconds: 60 },
  { key: "seconds", label: "S", seconds: 1 },
] as const;

export type CountdownParts = Record<(typeof COUNTDOWN_UNITS)[number]["key"], string>;

export function countdownParts(targetAt: number, now: number): CountdownParts {
  let remaining = Math.max(0, Math.floor((targetAt - now) / 1000));
  const values = {} as CountdownParts;
  for (const unit of COUNTDOWN_UNITS) {
    const amount = unit.key === "seconds" ? remaining : Math.floor(remaining / unit.seconds);
    if (unit.key !== "seconds") remaining -= amount * unit.seconds;
    values[unit.key] = String(amount).padStart(2, "0");
  }
  return values;
}

export function countdownFinished(targetAt: number, now: number): boolean {
  return now >= targetAt;
}
