import type { AdminOrder } from "@/lib/admin/types";

export type PlannedShippingTier = "fr" | "eu" | "intl" | "unknown";

const DEFAULT_PLANNED_EUR: Record<Exclude<PlannedShippingTier, "unknown">, number> = {
  fr: 6.9,
  eu: 12.9,
  intl: 24.9,
};

const TIER_LABEL: Record<PlannedShippingTier, string> = {
  fr: "France",
  eu: "UE",
  intl: "International",
  unknown: "Destination à vérifier",
};

function readPlannedEur(tier: Exclude<PlannedShippingTier, "unknown">): number {
  const envKey = {
    fr: "NEXT_PUBLIC_DINGRY_PLANNED_SHIPPING_FR_EUR",
    eu: "NEXT_PUBLIC_DINGRY_PLANNED_SHIPPING_EU_EUR",
    intl: "NEXT_PUBLIC_DINGRY_PLANNED_SHIPPING_INTL_EUR",
  }[tier];
  const raw = process.env[envKey];
  if (raw === undefined || raw === "") return DEFAULT_PLANNED_EUR[tier];
  const n = Number.parseFloat(String(raw).replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_PLANNED_EUR[tier];
}

/** Destination livraison (heuristique adresse PayPal / checkout). */
export function detectPlannedShippingTier(address: string | undefined): PlannedShippingTier {
  const normalized = (address ?? "").toUpperCase();
  if (!normalized.trim()) return "unknown";
  if (/,?\s*FR\s*$/.test(normalized) || /\bFRANCE\b/.test(normalized)) return "fr";
  if (
    /\b(DE|ES|IT|BE|NL|LU|PT|AT|IE|PL|CZ|SK|HU|RO|BG|HR|SI|EE|LV|LT|MT|CY|GR|SE|DK|FI)\s*$/.test(
      normalized.replace(/.*,\s*/, ""),
    ) ||
    /,\s*(DE|ES|IT|BE|NL|LU|PT|AT|IE)\b/.test(normalized)
  ) {
    return "eu";
  }
  return "intl";
}

export type PlannedShippingQuote = {
  tier: PlannedShippingTier;
  tierLabel: string;
  amountEur: number | null;
};

export function plannedShippingForOrder(order: AdminOrder): PlannedShippingQuote {
  const tier = detectPlannedShippingTier(order.shippingAddress);
  const amountEur = tier === "unknown" ? null : readPlannedEur(tier);
  return { tier, tierLabel: TIER_LABEL[tier], amountEur };
}