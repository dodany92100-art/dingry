import { createHash } from "node:crypto";
import { isProductSize } from "@/lib/admin/types";
import { loadPersonalizationProductIds } from "@/lib/atelier-custom-server";
import { loadStoreReadOnly } from "@/lib/admin/store";
import {
  resolveCheckoutLine,
  VITRINE_ONLY,
  type CheckoutLine,
} from "@/lib/checkout-line-resolve";
import { buildShopCatalogSnapshot } from "@/lib/shop-catalog-snapshot";
import {
  assertCheckoutStock,
  StockCheckoutError,
  stockLinesFromCheckout,
} from "@/lib/stock";

export { VITRINE_ONLY };
export type { CheckoutLine };

const MAX_LINES = 50;
const MAX_QTY = 99;
const MAX_PERSONALIZATION = 80;

export type CheckoutQuote = {
  lines: CheckoutLine[];
  totalCents: number;
  currency: "EUR";
  items: string[];
  paypalItems: { name: string; quantity: string; unitCents: number }[];
  digest: string;
  /** Saisi au checkout (hors digest PayPal). */
  customerPhone?: string;
};

export function formatCents(cents: number): string {
  const euros = Math.trunc(cents / 100);
  const fraction = String(Math.abs(cents % 100)).padStart(2, "0");
  return `${euros}.${fraction}`;
}

export function parsePaypalCents(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+\.\d{2}$/.test(value)) return null;
  const [euros, fraction] = value.split(".");
  const cents = Number(euros) * 100 + Number(fraction);
  return Number.isSafeInteger(cents) ? cents : null;
}

function readLine(value: unknown): CheckoutLine | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const productId = typeof record.productId === "number" ? record.productId : Number.NaN;
  const size = typeof record.size === "string" ? record.size.trim() : "";
  const qty = typeof record.qty === "number" ? record.qty : Number.NaN;
  if (!Number.isInteger(productId) || productId <= 0) return null;
  if (!isProductSize(size)) return null;
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return null;

  let selectedOption: string | undefined;
  if (typeof record.selectedOption === "string") {
    const raw = record.selectedOption.trim();
    if (raw) selectedOption = raw;
  }

  if (record.personalization === undefined) {
    return selectedOption ? { productId, size, qty, selectedOption } : { productId, size, qty };
  }
  if (typeof record.personalization !== "string") return null;
  const personalization = record.personalization.trim();
  if (!personalization || personalization.length > MAX_PERSONALIZATION) return null;
  if (/[\r\n]/.test(personalization)) return null;
  return selectedOption
    ? { productId, size, qty, personalization, selectedOption }
    : { productId, size, qty, personalization };
}

export function parseCheckoutLines(value: unknown): CheckoutLine[] | null {
  if (!value || typeof value !== "object") return null;
  const lines = (value as { lines?: unknown }).lines;
  if (!Array.isArray(lines) || lines.length === 0 || lines.length > MAX_LINES) return null;
  const parsed: CheckoutLine[] = [];
  for (const line of lines) {
    const item = readLine(line);
    if (!item) return null;
    parsed.push(item);
  }
  return parsed;
}

export function checkoutDigest(lines: CheckoutLine[]): string {
  const payload = lines
    .map(
      (line) =>
        `${line.productId}|${line.size}|${line.qty}|${line.personalization ?? ""}|${line.selectedOption ?? ""}`,
    )
    .join("\n");
  return createHash("sha256").update(payload).digest("hex");
}

export async function quoteCheckout(lines: CheckoutLine[]): Promise<CheckoutQuote | null> {
  const store = await loadStoreReadOnly();
  const snapshot = buildShopCatalogSnapshot(store);

  let totalCents = 0;
  const items: string[] = [];
  const paypalItems: CheckoutQuote["paypalItems"] = [];

  for (const line of lines) {
    const resolved = resolveCheckoutLine(line, snapshot);
    if (!resolved.ok) return null;

    const { unitCents, qty, label, paypalName } = resolved.line;
    const lineCents = unitCents * qty;
    if (!Number.isSafeInteger(lineCents) || totalCents + lineCents >= 10_000_000) return null;
    totalCents += lineCents;
    items.push(label);
    paypalItems.push({
      name: paypalName,
      quantity: String(qty),
      unitCents,
    });
  }

  if (totalCents <= 0) return null;

  const stock = await assertCheckoutStock(stockLinesFromCheckout(lines));
  if (!stock.ok) {
    throw new StockCheckoutError(stock.status, stock.error);
  }

  return {
    lines,
    totalCents,
    currency: "EUR",
    items,
    paypalItems,
    digest: checkoutDigest(lines),
  };
}
