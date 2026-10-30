import { checkoutDigest, parseCheckoutLines, type CheckoutLine, type CheckoutQuote } from "@/lib/checkout-quote";
import { getSharedRedis } from "@/lib/ratelimit";

const DRAFT_TTL_SECONDS = 60 * 60 * 24 * 7;

export type PayPalDraft = {
  lines: CheckoutLine[];
  totalCents: number;
  currency: "EUR";
  items: string[];
  digest: string;
};

function draftKey(orderId: string): string {
  return `dingry:paypal-draft:${orderId}`;
}

function parseDraft(value: unknown): PayPalDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const lines = parseCheckoutLines({ lines: record.lines });
  if (!lines || record.currency !== "EUR") return null;
  if (typeof record.totalCents !== "number" || !Number.isInteger(record.totalCents)) return null;
  if (record.totalCents <= 0 || record.totalCents >= 10_000_000) return null;
  if (typeof record.digest !== "string" || !/^[a-f0-9]{64}$/.test(record.digest)) return null;
  if (checkoutDigest(lines) !== record.digest) return null;
  if (!Array.isArray(record.items) || record.items.length !== lines.length) return null;

  const items: string[] = [];
  for (const item of record.items) {
    if (typeof item !== "string" || item.length === 0 || item.length > 180) return null;
    items.push(item);
  }

  return { lines, totalCents: record.totalCents, currency: "EUR", items, digest: record.digest };
}

export function quoteFromDraft(draft: PayPalDraft): CheckoutQuote {
  return {
    lines: draft.lines,
    totalCents: draft.totalCents,
    currency: "EUR",
    items: draft.items,
    paypalItems: [],
    digest: draft.digest,
  };
}

export async function savePayPalDraft(orderId: string, quote: CheckoutQuote): Promise<boolean> {
  const client = getSharedRedis();
  if (!client) return false;
  const payload = JSON.stringify({
    lines: quote.lines,
    totalCents: quote.totalCents,
    currency: quote.currency,
    items: quote.items,
    digest: quote.digest,
  });
  try {
    const result = await client.set(draftKey(orderId), payload, { nx: true, ex: DRAFT_TTL_SECONDS });
    return result === "OK";
  } catch (error) {
    console.error("Upstash injoignable", error instanceof Error ? error.message : "erreur");
    return false;
  }
}

export async function loadPayPalDraft(orderId: string): Promise<PayPalDraft | "missing" | "invalid" | "unavailable"> {
  const client = getSharedRedis();
  if (!client) return "unavailable";
  let raw: unknown;
  try {
    raw = await client.get<unknown>(draftKey(orderId));
  } catch (error) {
    console.error("Upstash injoignable", error instanceof Error ? error.message : "erreur");
    return "unavailable";
  }
  if (raw === null || raw === undefined) return "missing";
  try {
    const value = typeof raw === "string" ? (JSON.parse(raw) as unknown) : raw;
    return parseDraft(value) ?? "invalid";
  } catch {
    return "invalid";
  }
}
