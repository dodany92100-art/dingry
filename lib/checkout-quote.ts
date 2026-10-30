import { createHash } from "node:crypto";
import { loadStore } from "@/lib/admin/store";
import type { AdminProduct } from "@/lib/admin/types";
import { PERSONALIZATION_SURCHARGE_EUR } from "@/lib/checkout-draft";

const PERSONALIZABLE_PRODUCT_ID = 24;
const SHOP_SIZES = new Set(["XS", "S", "M", "L", "XL", "XXL", "TU"]);
const MAX_LINES = 50;
const MAX_QTY = 99;
const MAX_PERSONALIZATION = 80;

/** Pièces affichées sur la vitrine et absentes du catalogue admin. Le prix admin gagne dès qu'il existe. */
const VITRINE_ONLY: Record<number, { name: string; variant: string; price: number }> = {
  1: { name: "PHANTOM HOODIE", variant: "NUIT NOIRE — VERSO", price: 189 },
  3: { name: "DINGRY ORIGINAL HOODIE", variant: "VERT — VERSO", price: 189 },
  5: { name: "DINGRY ZIP HOODIE", variant: "BLACK OUTLINE — VERSO", price: 219 },
  8: { name: "DINGRY ORIGINAL HOODIE", variant: "BLACK — VERSO", price: 189 },
  12: { name: "DINGRY TEE", variant: "COLLECTION 02 — VERSO", price: 119 },
  14: { name: "DINGRY TEE", variant: "COLLECTION 04 — VERSO", price: 119 },
  15: { name: "DINGRY TEE", variant: "COLLECTION 05 — VERSO", price: 119 },
  16: { name: "DINGRY TEE", variant: "COLLECTION 06 — VERSO", price: 119 },
  18: { name: "DINGRY TEE", variant: "COLLECTION 08 — VERSO", price: 119 },
  20: { name: "DINGRY TEE", variant: "COLLECTION 10 — VERSO", price: 119 },
};

export type CheckoutLine = {
  productId: number;
  size: string;
  qty: number;
  personalization?: string;
};

export type CheckoutQuote = {
  lines: CheckoutLine[];
  totalCents: number;
  currency: "EUR";
  items: string[];
  paypalItems: { name: string; quantity: string; unitCents: number }[];
  digest: string;
};

function priceToCents(price: number): number | null {
  if (!Number.isFinite(price) || price <= 0 || price >= 100_000) return null;
  const cents = Math.round(price * 100);
  if (Math.abs(price * 100 - cents) > 0.001) return null;
  return cents;
}

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
  if (!SHOP_SIZES.has(size)) return null;
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return null;

  if (record.personalization === undefined) return { productId, size, qty };
  if (typeof record.personalization !== "string") return null;
  const personalization = record.personalization.trim();
  if (!personalization || personalization.length > MAX_PERSONALIZATION) return null;
  if (/[\r\n]/.test(personalization)) return null;
  return { productId, size, qty, personalization };
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
    .map((line) => `${line.productId}|${line.size}|${line.qty}|${line.personalization ?? ""}`)
    .join("\n");
  return createHash("sha256").update(payload).digest("hex");
}

export async function quoteCheckout(lines: CheckoutLine[]): Promise<CheckoutQuote | null> {
  const store = await loadStore();
  const byId = new Map<number, AdminProduct>();
  for (const product of store.products) {
    const id = Number(product.id);
    if (Number.isInteger(id) && id > 0) byId.set(id, product);
  }

  let totalCents = 0;
  const items: string[] = [];
  const paypalItems: CheckoutQuote["paypalItems"] = [];

  for (const line of lines) {
    const product = byId.get(line.productId);
    const fallback = VITRINE_ONLY[line.productId];
    const name = product?.name ?? fallback?.name;
    const variant = product?.variant ?? fallback?.variant ?? "";
    const price = product?.price ?? fallback?.price;
    if (!name || price === undefined) return null;
    const baseCents = priceToCents(price);
    if (baseCents === null) return null;

    const personalized = line.personalization !== undefined;
    if (personalized && line.productId !== PERSONALIZABLE_PRODUCT_ID) return null;
    const unitCents = baseCents + (personalized ? PERSONALIZATION_SURCHARGE_EUR * 100 : 0);
    const lineCents = unitCents * line.qty;
    if (!Number.isSafeInteger(lineCents) || totalCents + lineCents >= 10_000_000) return null;
    totalCents += lineCents;

    const label = `${name}${variant ? ` — ${variant}` : ""}`.slice(0, 120);
    const detail = personalized ? `${label} — ${line.personalization}` : label;
    items.push(`${detail} — ${line.size} ×${line.qty}`.slice(0, 180));
    paypalItems.push({
      name: (personalized ? `${name} perso` : `${name} ${variant}`).trim().slice(0, 127),
      quantity: String(line.qty),
      unitCents,
    });
  }

  if (totalCents <= 0) return null;

  return {
    lines,
    totalCents,
    currency: "EUR",
    items,
    paypalItems,
    digest: checkoutDigest(lines),
  };
}
