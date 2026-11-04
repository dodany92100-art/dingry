### FILE: app/api/checkout/route.ts
```
import { NextResponse } from "next/server";
import type { AdminOrder } from "@/lib/admin/types";
import { StoreUnavailableError } from "@/lib/admin/store";
import { parseCheckoutLines, quoteCheckout, type CheckoutQuote } from "@/lib/checkout-quote";
import { StockCheckoutError } from "@/lib/stock";
import { savePayPalDraft } from "@/lib/paypal-draft";
import { isPayPalOrderId } from "@/lib/paypal-order-id";
import { PAYPAL_ORDER_FINALIZING_MESSAGE, persistPayPalPayment } from "@/lib/paypal-persist";
import {
  capturePayPalOrder,
  createPayPalOrder,
  fetchPayPalOrder,
  orderReadyToCapture,
  paypalConfigured,
  readVerifiedPayment,
} from "@/lib/paypal-server";
import { limitCheckoutEntry, limitCheckoutPayment, limitCheckoutQuote } from "@/lib/ratelimit";
import { clientIp } from "@/lib/request-ip";
import { turnstileRemoteIp, turnstileTokenFromBody, verifyTurnstileToken } from "@/lib/turnstile";

export const runtime = "nodejs";
/** Inférieur au TTL du verrou Redis PayPal (`PAYPAL_ORDER_LOCK_TTL_SECONDS`). */
export const maxDuration = 60;

const CHECKOUT_MAX_BODY = 32_000;

function limited(gate: Exclude<Awaited<ReturnType<typeof limitCheckoutEntry>>, { ok: true }>) {
  const headers: Record<string, string> = {};
  if (gate.status === 429) {
    headers["Retry-After"] = String(gate.retryAfter);
    headers["X-RateLimit-Limit"] = String(gate.limit);
    headers["X-RateLimit-Remaining"] = String(gate.remaining);
  }
  return NextResponse.json({ error: gate.error }, { status: gate.status, headers });
}

function persistFailed(saved: { ok: false; status: 409 | 503; error: string }) {
  const headers: Record<string, string> = {};
  if (saved.status === 503 && saved.error === PAYPAL_ORDER_FINALIZING_MESSAGE) {
    headers["Retry-After"] = "3";
  }
  return NextResponse.json({ error: saved.error }, { status: saved.status, headers });
}

function confirmationOf(order: AdminOrder) {
  return {
    orderId: order.id,
    payerName: order.customerName,
    email: order.email,
    total: order.total,
    items: order.items,
    shippingName: order.shippingName ?? "",
    shippingAddress: order.shippingAddress ?? "",
  };
}


export async function POST(request: Request) {
  const ip = clientIp(request);
  const entryGate = await limitCheckoutEntry(ip);
  if (!entryGate.ok) return limited(entryGate);

  const contentLength = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(contentLength) && contentLength > CHECKOUT_MAX_BODY) {
    return NextResponse.json({ error: "Commande invalide." }, { status: 400 });
  }

  let raw = "";
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json({ error: "Commande invalide." }, { status: 400 });
  }
  if (raw.length === 0 || raw.length > CHECKOUT_MAX_BODY) {
    return NextResponse.json({ error: "Commande invalide." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json({ error: "Commande invalide." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Commande invalide." }, { status: 400 });
  }

  const lines = parseCheckoutLines(body);
  if (!lines) return NextResponse.json({ error: "Commande invalide." }, { status: 400 });

  let quote: CheckoutQuote | null = null;
  try {
    quote = await quoteCheckout(lines);
  } catch (error) {
    if (error instanceof StockCheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof StoreUnavailableError) {
      console.error("Catalogue injoignable", error.name);
      return NextResponse.json({ error: "Dingry collection indisponible." }, { status: 503 });
    }
    console.error("Catalogue injoignable", error instanceof Error ? error.name : "erreur");
    return NextResponse.json({ error: "Dingry collection indisponible." }, { status: 503 });
  }
  if (!quote) {
    return NextResponse.json({ error: "Un article n'est plus dans Dingry collection." }, { status: 400 });
  }
  const priced = quote;

  const intent = (body as { intent?: unknown }).intent;
  const gate =
    intent === "quote" ? await limitCheckoutQuote(ip) : await limitCheckoutPayment(ip);
  if (!gate.ok) return limited(gate);

  if (intent === "quote") {
    return NextResponse.json({
      currency: priced.currency,
      totalCents: priced.totalCents,
      lines: priced.lines.map((line, index) => ({
        label: priced.items[index] ?? "",
        size: line.size,
        qty: line.qty,
        amountCents: (priced.paypalItems[index]?.unitCents ?? 0) * line.qty,
      })),
    });
  }

  if (!paypalConfigured()) {
    return NextResponse.json({ error: "Paiement indisponible." }, { status: 503 });
  }

  if (intent === "create") {
    const createVerdict = await verifyTurnstileToken(turnstileTokenFromBody(body), turnstileRemoteIp(request));
    if (!createVerdict.ok) {
      return NextResponse.json({ error: createVerdict.error }, { status: createVerdict.status });
    }
    try {
      const created = await createPayPalOrder(quote);
      if (!created || !isPayPalOrderId(created.orderId)) {
        return NextResponse.json({ error: "Le paiement PayPal n'a pas abouti." }, { status: 502 });
      }
      const drafted = await savePayPalDraft(created.orderId, quote);
      if (!drafted && process.env.NODE_ENV !== "development") {
        console.error("Brouillon PayPal non enregistré", created.orderId);
        return NextResponse.json({ error: "Paiement indisponible." }, { status: 503 });
      }
      return NextResponse.json(
        { orderId: created.orderId },
        {
          headers: {
            "X-RateLimit-Limit": String(gate.limit),
            "X-RateLimit-Remaining": String(gate.remaining),
          },
        },
      );
    } catch (error) {
      console.error("PayPal création", error instanceof Error ? error.message : "erreur");
      return NextResponse.json({ error: "Le paiement PayPal n'a pas abouti." }, { status: 502 });
    }
  }

  if (intent !== "capture") {
    return NextResponse.json({ error: "Commande invalide." }, { status: 400 });
  }

  const verdict = await verifyTurnstileToken(turnstileTokenFromBody(body), turnstileRemoteIp(request));
  if (!verdict.ok) {
    return NextResponse.json({ error: verdict.error }, { status: verdict.status });
  }

  const rawOrderId = (body as { orderId?: unknown }).orderId;
  const orderId = typeof rawOrderId === "string" ? rawOrderId.trim() : "";
  if (!isPayPalOrderId(orderId)) {
    return NextResponse.json({ error: "Commande invalide." }, { status: 400 });
  }

  try {
    const fetched = await fetchPayPalOrder(orderId);
    if (!fetched.ok) {
      console.error("PayPal lecture", fetched.issue);
      const status = fetched.status === 503 ? 503 : 400;
      const error = status === 503 ? "Paiement indisponible." : "Paiement PayPal introuvable.";
      return NextResponse.json({ error }, { status });
    }

    const lookedUp = fetched.order;
    const ready = orderReadyToCapture(lookedUp, quote);
    if (!ready && lookedUp.status !== "COMPLETED") {
      return NextResponse.json({ error: "Le montant PayPal ne correspond pas à la commande." }, { status: 400 });
    }

    let paypalOrder = lookedUp;
    if (ready) {
      const captured = await capturePayPalOrder(orderId);
      if (!captured.ok) {
        console.error("PayPal capture", captured.issue);
        if (captured.issue !== "ORDER_ALREADY_CAPTURED") {
          const status = captured.status === 503 ? 503 : 400;
          const error = status === 503 ? "Paiement indisponible." : "Le paiement PayPal n'a pas abouti.";
          return NextResponse.json({ error }, { status });
        }
        const again = await fetchPayPalOrder(orderId);
        if (!again.ok) {
          return NextResponse.json({ error: "Paiement indisponible." }, { status: 503 });
        }
        paypalOrder = again.order;
      } else {
        paypalOrder = captured.order;
      }
    }

    const payment = readVerifiedPayment(paypalOrder, quote);
    if (!payment || payment.orderId !== orderId) {
      return NextResponse.json({ error: "Le montant PayPal ne correspond pas à la commande." }, { status: 400 });
    }

    const saved = await persistPayPalPayment(payment, quote);
    if (!saved.ok) {
      return persistFailed(saved);
    }

    return NextResponse.json(
      { ok: true, order: confirmationOf(saved.order) },
      {
        headers: {
          "X-RateLimit-Limit": String(gate.limit),
          "X-RateLimit-Remaining": String(gate.remaining),
        },
      },
    );
  } catch (error) {
    console.error("Enregistrement commande", error instanceof Error ? error.message : "erreur");
    return NextResponse.json({ error: "Enregistrement indisponible." }, { status: 503 });
  }
}
```

### FILE: lib/paypal-server.ts
```
import { formatCents, parsePaypalCents, type CheckoutQuote } from "@/lib/checkout-quote";

type PaypalAmount = { currency_code?: string; value?: string };

type PaypalOrder = {
  id?: string;
  status?: string;
  payer?: {
    email_address?: string;
    name?: { given_name?: string; surname?: string };
  };
  purchase_units?: PaypalPurchaseUnit[];
};

type PaypalPurchaseUnit = {
  custom_id?: string;
  amount?: PaypalAmount;
  payments?: {
    captures?: {
      id?: string;
      status?: string;
      amount?: PaypalAmount;
    }[];
  };
  shipping?: {
    name?: { full_name?: string };
    address?: {
      address_line_1?: string;
      address_line_2?: string;
      admin_area_2?: string;
      postal_code?: string;
      country_code?: string;
    };
  };
};

export type VerifiedPayPalPayment = {
  orderId: string;
  captureId: string;
  payerName: string;
  email: string;
  totalCents: number;
  currency: "EUR";
  shippingName: string;
  shippingAddress: string;
};

type PaypalCallResult = { ok: true; order: PaypalOrder } | { ok: false; status: number; issue: string };

let tokenCache: { value: string; expiresAt: number } | null = null;

function paypalConfig(): { clientId: string; secret: string; base: string } | null {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim() || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() || "";
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim() || "";
  if (!clientId || !secret) return null;
  const sandbox = process.env.PAYPAL_ENV?.trim().toLowerCase() === "sandbox";
  return {
    clientId,
    secret,
    base: sandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com",
  };
}

async function accessToken(config: { clientId: string; secret: string; base: string }): Promise<string | null> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) return tokenCache.value;

  const response = await fetch(`${config.base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) return null;
  const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 0;
  tokenCache = { value: data.access_token, expiresAt: Date.now() + expiresIn * 1000 };
  return data.access_token;
}

async function paypalFetch(path: string, init: RequestInit): Promise<PaypalCallResult> {
  const config = paypalConfig();
  if (!config) return { ok: false, status: 503, issue: "unconfigured" };
  const token = await accessToken(config);
  if (!token) return { ok: false, status: 503, issue: "oauth" };

  const response = await fetch(`${config.base}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : Array.isArray(init.headers)
          ? Object.fromEntries(init.headers)
          : (init.headers ?? {})),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  const data = (await response.json().catch(() => null)) as
    | (PaypalOrder & { name?: string; details?: { issue?: string }[] })
    | null;
  if (!response.ok) {
    const issue = data?.details?.[0]?.issue || data?.name || "paypal";
    console.error("PayPal refus", response.status, issue);
    return { ok: false, status: response.status, issue };
  }
  return { ok: true, order: data ?? {} };
}

export function paypalConfigured(): boolean {
  return paypalConfig() !== null;
}

export async function createPayPalOrder(quote: CheckoutQuote): Promise<{ orderId: string } | null> {
  const value = formatCents(quote.totalCents);
  const result = await paypalFetch("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: quote.digest,
          amount: {
            currency_code: quote.currency,
            value,
            breakdown: {
              item_total: { currency_code: quote.currency, value },
            },
          },
          items: quote.paypalItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            category: "PHYSICAL_GOODS",
            unit_amount: { currency_code: quote.currency, value: formatCents(item.unitCents) },
          })),
        },
      ],
      application_context: {
        brand_name: "DINGRY",
        shipping_preference: "GET_FROM_FILE",
        user_action: "PAY_NOW",
      },
    }),
  });
  if (!result.ok || !result.order.id) return null;
  return { orderId: result.order.id };
}

export async function fetchPayPalOrder(orderId: string): Promise<PaypalCallResult> {
  return paypalFetch(`/v2/checkout/orders/${encodeURIComponent(orderId)}`, { method: "GET" });
}

export async function capturePayPalOrder(orderId: string): Promise<PaypalCallResult> {
  return paypalFetch(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    headers: { "PayPal-Request-Id": `dingry-capture-${orderId}` },
    body: "{}",
  });
}

function formatAddress(unit: PaypalPurchaseUnit | undefined): string {
  const address = unit?.shipping?.address;
  if (!address) return "";
  return [
    address.address_line_1,
    address.address_line_2,
    [address.postal_code, address.admin_area_2].filter(Boolean).join(" "),
    address.country_code,
  ]
    .map((part) => part?.trim() ?? "")
    .filter((part) => part.length > 0)
    .join(", ")
    .slice(0, 280);
}

function amountMatches(amount: PaypalAmount | undefined, quote: CheckoutQuote): boolean {
  return amount?.currency_code === quote.currency && parsePaypalCents(amount.value) === quote.totalCents;
}

export function readVerifiedPayment(order: PaypalOrder, quote: CheckoutQuote): VerifiedPayPalPayment | null {
  if (order.status !== "COMPLETED" || !order.id) return null;
  const unit = order.purchase_units?.[0];
  if (!unit || order.purchase_units?.length !== 1) return null;
  if (unit.custom_id !== quote.digest) return null;
  if (!amountMatches(unit.amount, quote)) return null;

  const capture = unit.payments?.captures?.[0];
  if (!capture?.id || capture.status !== "COMPLETED") return null;
  if (!amountMatches(capture.amount, quote)) return null;

  const given = order.payer?.name?.given_name?.trim() ?? "";
  const family = order.payer?.name?.surname?.trim() ?? "";
  const payerName = `${given} ${family}`.trim() || unit.shipping?.name?.full_name?.trim() || "Client PayPal";

  return {
    orderId: order.id,
    captureId: capture.id,
    payerName: payerName.slice(0, 120),
    email: (order.payer?.email_address?.trim() ?? "").slice(0, 180),
    totalCents: quote.totalCents,
    currency: "EUR",
    shippingName: (unit.shipping?.name?.full_name?.trim() || payerName).slice(0, 120),
    shippingAddress: formatAddress(unit),
  };
}

export function orderReadyToCapture(order: PaypalOrder, quote: CheckoutQuote): boolean {
  if (order.status !== "APPROVED") return false;
  const unit = order.purchase_units?.[0];
  if (!unit || order.purchase_units?.length !== 1) return false;
  return unit.custom_id === quote.digest && amountMatches(unit.amount, quote);
}

export type PayPalWebhookHeaders = {
  transmissionId: string;
  transmissionTime: string;
  transmissionSig: string;
  certUrl: string;
  authAlgo: string;
};

const TRANSMISSION_ID = /^[A-Za-z0-9_-]{8,100}$/;
const TRANSMISSION_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;
const TRANSMISSION_SIG = /^[A-Za-z0-9+/]+=*$/;
const WEBHOOK_ID = /^[A-Za-z0-9_-]{8,80}$/;

function paypalWebhookId(): string | null {
  const id = process.env.PAYPAL_WEBHOOK_ID?.trim() ?? "";
  return WEBHOOK_ID.test(id) ? id : null;
}

export function paypalWebhookConfigured(): boolean {
  return paypalConfigured() && paypalWebhookId() !== null;
}

function paypalCertUrl(url: string): { sandbox: boolean } | null {
  if (url.length > 200) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash || parsed.port) return null;
  if (parsed.protocol !== "https:") return null;
  if (!/^\/v1\/notifications\/certs\/[A-Za-z0-9-]{8,80}$/.test(parsed.pathname)) return null;
  const sandbox = parsed.hostname === "api.sandbox.paypal.com" || parsed.hostname === "api-m.sandbox.paypal.com";
  const live = parsed.hostname === "api.paypal.com" || parsed.hostname === "api-m.paypal.com";
  if (!sandbox && !live) return null;
  return { sandbox };
}

export function readPayPalWebhookHeaders(request: Request): PayPalWebhookHeaders | null {
  const transmissionId = request.headers.get("paypal-transmission-id")?.trim() ?? "";
  const transmissionTime = request.headers.get("paypal-transmission-time")?.trim() ?? "";
  const transmissionSig = request.headers.get("paypal-transmission-sig")?.trim() ?? "";
  const certUrl = request.headers.get("paypal-cert-url")?.trim() ?? "";
  const authAlgo = request.headers.get("paypal-auth-algo")?.trim() ?? "";
  if (!TRANSMISSION_ID.test(transmissionId)) return null;
  if (!TRANSMISSION_TIME.test(transmissionTime)) return null;
  if (transmissionSig.length < 40 || transmissionSig.length > 2000 || !TRANSMISSION_SIG.test(transmissionSig)) return null;
  if (authAlgo !== "SHA256withRSA") return null;
  if (!paypalCertUrl(certUrl)) return null;
  return { transmissionId, transmissionTime, transmissionSig, certUrl, authAlgo };
}

export async function verifyPayPalWebhookSignature(
  headers: PayPalWebhookHeaders,
  rawEventJson: string,
): Promise<"ok" | "invalid" | "unavailable" | "auth"> {
  const config = paypalConfig();
  const webhookId = paypalWebhookId();
  if (!config || !webhookId) return "unavailable";

  const trimmed = rawEventJson.trim();
  if (trimmed.length === 0 || trimmed[0] !== "{" || trimmed[trimmed.length - 1] !== "}") {
    return "invalid";
  }

  const cert = paypalCertUrl(headers.certUrl);
  const sandbox = config.base.includes("sandbox");
  if (!cert || cert.sandbox !== sandbox) return "invalid";

  let token: string | null = null;
  try {
    token = await accessToken(config);
  } catch (error) {
    console.error("[paypal-webhook] token", error instanceof Error ? error.name : "erreur");
    return "unavailable";
  }
  if (!token) return "unavailable";

  const body =
    `{"auth_algo":${JSON.stringify(headers.authAlgo)},` +
    `"cert_url":${JSON.stringify(headers.certUrl)},` +
    `"transmission_id":${JSON.stringify(headers.transmissionId)},` +
    `"transmission_sig":${JSON.stringify(headers.transmissionSig)},` +
    `"transmission_time":${JSON.stringify(headers.transmissionTime)},` +
    `"webhook_id":${JSON.stringify(webhookId)},` +
    `"webhook_event":${rawEventJson}}`;

  let response: Response;
  try {
    response = await fetch(`${config.base}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    console.error("[paypal-webhook] verify", error instanceof Error ? error.name : "erreur");
    return "unavailable";
  }

  const data = (await response.json().catch(() => null)) as { verification_status?: string } | null;
  if (!response.ok) {
    console.error("[paypal-webhook] verify", response.status);
    if (response.status === 401 || response.status === 403) return "auth";
    return response.status >= 500 ? "unavailable" : "invalid";
  }
  return data?.verification_status === "SUCCESS" ? "ok" : "invalid";
}
```

### FILE: lib/checkout-quote.ts
```
import { createHash } from "node:crypto";
import { loadStoreReadOnly } from "@/lib/admin/store";
import type { AdminProduct } from "@/lib/admin/types";
import { resolveRectoCatalogId } from "@/lib/catalog-verso-recto";
import { PERSONALIZATION_SURCHARGE_EUR } from "@/lib/checkout-draft";
import {
  assertCheckoutStock,
  StockCheckoutError,
  stockLinesFromCheckout,
} from "@/lib/stock";

const PERSONALIZABLE_PRODUCT_ID = 24;
const SHOP_SIZES = new Set(["XS", "S", "M", "L", "XL", "XXL", "TU"]);
const MAX_LINES = 50;
const MAX_QTY = 99;
const MAX_PERSONALIZATION = 80;

/** Pièces affichées sur la vitrine et absentes du catalogue admin. Le prix admin gagne dès qu'il existe. */
export const VITRINE_ONLY: Record<number, { name: string; variant: string; price: number }> = {
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
  const store = await loadStoreReadOnly();
  const byId = new Map<number, AdminProduct>();
  for (const product of store.products) {
    const id = Number(product.id);
    if (Number.isInteger(id) && id > 0) byId.set(id, product);
  }

  let totalCents = 0;
  const items: string[] = [];
  const paypalItems: CheckoutQuote["paypalItems"] = [];

  for (const line of lines) {
    const rectoId = resolveRectoCatalogId(line.productId);
    const product = byId.get(line.productId) ?? byId.get(rectoId);
    const fallback = product ? undefined : VITRINE_ONLY[line.productId];
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
```

### FILE: lib/paypal-webhook.ts
```
import { isPayPalOrderId } from "@/lib/paypal-order-id";

const REFUND_ALERT_TYPES = new Set(["PAYMENT.CAPTURE.REFUNDED", "PAYMENT.CAPTURE.REVERSED"]);

export function paypalWebhookEventType(event: unknown): string | null {
  if (!event || typeof event !== "object" || Array.isArray(event)) return null;
  const type = (event as { event_type?: unknown }).event_type;
  return typeof type === "string" ? type : null;
}

export function paypalRefundAlertType(event: unknown): string | null {
  const type = paypalWebhookEventType(event);
  if (!type || !REFUND_ALERT_TYPES.has(type)) return null;
  return type;
}

function readCaptureResourceIds(event: unknown): { captureId?: string; orderId?: string } {
  const resource = (event as { resource?: unknown }).resource;
  if (!resource || typeof resource !== "object" || Array.isArray(resource)) return {};
  const record = resource as {
    id?: unknown;
    supplementary_data?: { related_ids?: { order_id?: unknown } };
  };
  const captureId = typeof record.id === "string" && record.id.length > 0 ? record.id : undefined;
  const related = record.supplementary_data?.related_ids?.order_id;
  const orderId =
    typeof related === "string" && isPayPalOrderId(related) ? related.trim() : undefined;
  return { captureId, orderId };
}

export function paypalRefundAlertContext(
  event: unknown,
): { eventType: string; captureId?: string; orderId?: string } | null {
  const eventType = paypalRefundAlertType(event);
  if (!eventType) return null;
  return { eventType, ...readCaptureResourceIds(event) };
}

/** Identifiant de commande PayPal lié à une capture, ou un signal de traitement. */
export function paypalCaptureOrderId(event: unknown): string | "ignore" | "invalid" {
  const type = paypalWebhookEventType(event);
  if (!type) return "invalid";
  if (type !== "PAYMENT.CAPTURE.COMPLETED") return "ignore";

  const { orderId } = readCaptureResourceIds(event);
  if (!orderId) return "invalid";
  return orderId;
}

export function paypalCaptureResourceIds(event: unknown): { captureId?: string; orderId?: string } {
  if (paypalWebhookEventType(event) !== "PAYMENT.CAPTURE.COMPLETED") return {};
  return readCaptureResourceIds(event);
}
```

### FILE: lib/ops-alert.ts
```
/**
 * Alerte ops minimale (Resend) — id commande + motif, sans données client.
 */
import { getSharedRedis } from "@/lib/ratelimit";

export const OPS_ALERT_FETCH_TIMEOUT_MS = 5_000;

const ALERT_DEDUPE_TTL_SECONDS = 60 * 60 * 24;

function isProductionDeploy(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}

function dedupeKey(key: string): string {
  return `dingry:ops-alert-sent:${key}`;
}

export function orphanPaymentKey(orderId: string): string {
  return `dingry:paypal-orphan:${orderId}`;
}

/** @returns true si Resend a accepté l’e-mail (ou config absente en dev). */
export async function sendOpsAlert(subject: string, details: { orderId?: string; reason: string }): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const to = process.env.OPS_ALERT_EMAIL?.trim() ?? "";
  const from = process.env.OPS_ALERT_FROM?.trim() ?? "";

  console.error("[ops-alert]", { subject, orderId: details.orderId, reason: details.reason });

  if (!apiKey || !to || !from) {
    if (isProductionDeploy()) {
      console.error("[ops-alert] RESEND_API_KEY, OPS_ALERT_EMAIL ou OPS_ALERT_FROM manquant — alerte non envoyée");
    }
    return false;
  }

  const text = [`Motif: ${details.reason}`, `Commande PayPal: ${details.orderId ?? "—"}`, `Site: DINGRY`].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `[DINGRY] ${subject}`,
        text,
      }),
      signal: AbortSignal.timeout(OPS_ALERT_FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      console.error("[ops-alert] Resend", response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[ops-alert] envoi", error instanceof Error ? error.name : "erreur");
    return false;
  }
}

/**
 * Une alerte par clé sur 24 h si Redis OK. Redis indisponible : envoi quand même (fail-open).
 * Le marqueur n’est conservé qu’après envoi Resend réussi.
 */
export async function sendOpsAlertOnce(
  dedupeId: string,
  subject: string,
  details: { orderId?: string; reason: string },
): Promise<void> {
  const client = getSharedRedis();
  const redisKey = dedupeKey(dedupeId);

  if (client) {
    try {
      const locked = await client.set(redisKey, "1", { nx: true, ex: ALERT_DEDUPE_TTL_SECONDS });
      if (locked !== "OK") return;
    } catch (error) {
      console.error("[ops-alert] dedupe", error instanceof Error ? error.name : "erreur");
    }
  }

  const sent = await sendOpsAlert(subject, details);

  if (sent) return;

  if (client) {
    try {
      await client.del(redisKey);
    } catch (error) {
      console.error("[ops-alert] dedupe rollback", error instanceof Error ? error.name : "erreur");
    }
  }
}

/** Trace durable pour runbook (sans TTL). N’échoue jamais. */
export async function markPayPalPaymentOrphan(orderId: string, reason: string): Promise<void> {
  console.error("[paypal-orphan]", { orderId, reason });
  const client = getSharedRedis();
  if (!client) return;
  try {
    await client.set(
      orphanPaymentKey(orderId),
      JSON.stringify({ reason, recordedAt: new Date().toISOString() }),
      { nx: true },
    );
  } catch (error) {
    console.error("[paypal-orphan] Redis", error instanceof Error ? error.name : "erreur");
  }
}

/** À appeler quand la commande est enregistrée ou régularisée dans le CRM. */
export async function clearPayPalPaymentOrphan(orderId: string): Promise<void> {
  const client = getSharedRedis();
  if (!client) return;
  try {
    await client.del(orphanPaymentKey(orderId));
  } catch (error) {
    console.error("[paypal-orphan] clear", error instanceof Error ? error.name : "erreur");
  }
}
```

### FILE: lib/admin/store.ts
```
import { createHash } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { BlobPreconditionFailedError, del, get, put } from "@vercel/blob";
import { isBlobConfigured } from "@/lib/admin/blob-config";
import { adjustStock, readStockQuantity, seedCatalogStockFromProducts, seedStockIfMissing } from "@/lib/stock";
import { createSeededStore, SEEDED_PRODUCTS } from "@/lib/admin/seed";
import { CATALOG_CANONICAL_IMAGE_BY_ID, DINGRY_JERSEY_PRODUCT_IDS, DINGRY_SWEAT_PRODUCT_IDS, DINGRY_TEE_PRODUCT_IDS } from "@/lib/dingry-product-media";
import {
  isProductCategory,
  isProductSize,
  STORE_VERSION,
  type AdminOrder,
  type AdminProduct,
  type AdminStore,
  type ProductCategory,
  type ProductSize,
} from "@/lib/admin/types";

const STORE_PATHNAME = "dingry/admin/store.json";
const LOCAL_STORE_PATH = path.join(process.cwd(), "data", "admin", "store.json");
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), "public", "admin-uploads");
const MAX_IMAGE_BYTES = 1 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/webp"]);
const STORE_WRITE_ATTEMPTS = 5;

export class StoreConflictError extends Error {
  constructor() {
    super("store-conflict");
    this.name = "StoreConflictError";
  }
}

export class StoreUnavailableError extends Error {
  constructor(message = "Magasin indisponible.") {
    super(message);
    this.name = "StoreUnavailableError";
  }
}

type StoreSnapshot = {
  store: AdminStore;
  etag: string | null;
};

/** Seules les erreurs de concurrence optimiste déclenchent un retry. */
export function isStoreWriteConflict(error: unknown): boolean {
  return error instanceof BlobPreconditionFailedError || error instanceof StoreConflictError;
}

function storeWriteBackoff(attempt: number): Promise<void> {
  const ms = 50 + Math.random() * 100 + attempt * 25;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function revisionFromDiskText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function cloneStore(store: AdminStore): AdminStore {
  return {
    ...store,
    products: store.products.map((product) => ({ ...product, sizes: [...product.sizes] })),
    orders: store.orders.map((order) => ({ ...order })),
  };
}

function assertStoreBackend(): void {
  if (process.env.NODE_ENV === "production" && !isBlobConfigured()) {
    throw new StoreUnavailableError("BLOB_READ_WRITE_TOKEN requis en production.");
  }
}

function useLocalStoreFiles(): boolean {
  return process.env.NODE_ENV !== "production" && !isBlobConfigured();
}

async function readStoreSnapshot(): Promise<StoreSnapshot | "missing"> {
  assertStoreBackend();

  if (isBlobConfigured()) {
    const result = await get(STORE_PATHNAME, { access: "public", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) return "missing";
    const text = await new Response(result.stream).text();
    const parsed: unknown = JSON.parse(text);
    if (!isAdminStore(parsed)) return "missing";
    const raw = parsed as AdminStore;
    return {
      store: normalizeStore(raw),
      etag: result.blob.etag,
    };
  }

  if (!useLocalStoreFiles()) {
    throw new StoreUnavailableError();
  }

  try {
    const text = await readFile(LOCAL_STORE_PATH, "utf8");
    const parsed: unknown = JSON.parse(text);
    if (!isAdminStore(parsed)) return "missing";
    const raw = parsed as AdminStore;
    return {
      store: normalizeStore(raw),
      etag: revisionFromDiskText(text),
    };
  } catch {
    return "missing";
  }
}

async function writeStoreSnapshot(store: AdminStore, etag: string | null): Promise<void> {
  assertStoreBackend();
  const next: AdminStore = { ...store, version: STORE_VERSION };
  const body = JSON.stringify(next);

  if (isBlobConfigured()) {
    await put(STORE_PATHNAME, body, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: etag !== null,
      contentType: "application/json",
      cacheControlMaxAge: 0,
      ...(etag ? { ifMatch: etag } : {}),
    });
    return;
  }

  if (!useLocalStoreFiles()) {
    throw new StoreUnavailableError();
  }

  if (etag) {
    try {
      const current = await readFile(LOCAL_STORE_PATH, "utf8");
      if (revisionFromDiskText(current) !== etag) {
        throw new StoreConflictError();
      }
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === "ENOENT") throw new StoreConflictError();
      if (error instanceof StoreConflictError) throw error;
      throw error;
    }
  }

  await mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true });
  await writeFile(LOCAL_STORE_PATH, JSON.stringify(next, null, 2), "utf8");
}

async function withStoreOptimistic<T>(
  mutate: (store: AdminStore) => { store: AdminStore; result: T; skipWrite?: boolean },
): Promise<T> {
  for (let attempt = 0; attempt < STORE_WRITE_ATTEMPTS; attempt++) {
    let snapshot = await readStoreSnapshot();
    if (snapshot === "missing") {
      snapshot = {
        store: normalizeStore(createSeededStore()),
        etag: null,
      };
    }

    const working = cloneStore(snapshot.store);
    const outcome = mutate(working);
    if (outcome.skipWrite) return outcome.result;

    try {
      await writeStoreSnapshot(outcome.store, snapshot.etag);
      return outcome.result;
    } catch (error) {
      if (!isStoreWriteConflict(error)) throw error;
      await storeWriteBackoff(attempt);
    }
  }

  throw new StoreConflictError();
}

function isAdminStore(value: unknown): value is AdminStore {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return Array.isArray(record.products) && Array.isArray(record.orders);
}

function normalizeProduct(value: unknown): AdminProduct | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = String(record.id ?? "").trim();
  const name = String(record.name ?? "").trim();
  const price = Number(record.price);
  const imageUrl = String(record.imageUrl ?? "").trim();
  if (!id || !name || !imageUrl || !Number.isFinite(price) || price <= 0) return null;

  const sizes = Array.isArray(record.sizes)
    ? record.sizes.filter((item): item is ProductSize => typeof item === "string" && isProductSize(item))
    : (["S", "M", "L", "XL"] as ProductSize[]);

  const categoryValue = String(record.category ?? "Tee");
  const category: ProductCategory = isProductCategory(categoryValue) ? categoryValue : "Tee";

  return {
    id,
    sku: String(record.sku ?? `DINGRY-${id}`).trim() || `DINGRY-${id}`,
    name,
    variant: String(record.variant ?? "").trim(),
    description: String(record.description ?? "").trim(),
    category,
    price,
    sizes: sizes.length > 0 ? sizes : ["S", "M", "L", "XL"],
    stock: Math.max(0, Math.floor(Number(record.stock) || 0)),
    imageUrl,
    blobUrl: typeof record.blobUrl === "string" ? record.blobUrl : null,
    blobPathname: typeof record.blobPathname === "string" ? record.blobPathname : null,
    createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString(),
  };
}

function mergeSeedProduct(seed: AdminProduct, current: AdminProduct | undefined): AdminProduct {
  const seedIdNum = Number(seed.id);
  const canonicalImage = CATALOG_CANONICAL_IMAGE_BY_ID[seedIdNum];
  const catalogLocked =
    DINGRY_SWEAT_PRODUCT_IDS.has(seedIdNum) ||
    DINGRY_TEE_PRODUCT_IDS.has(seedIdNum) ||
    DINGRY_JERSEY_PRODUCT_IDS.has(seedIdNum) ||
    canonicalImage !== undefined;
  if (!current) return { ...seed, sizes: [...seed.sizes] };
  const genericSku = !current.sku || current.sku === `DINGRY-${current.id}`;
  const genericCategory = current.category === "Tee" && seed.category !== "Tee";
  if (catalogLocked) {
    return {
      ...seed,
      ...current,
      imageUrl:
        canonicalImage ??
        (DINGRY_JERSEY_PRODUCT_IDS.has(seedIdNum) && current.imageUrl ? current.imageUrl : seed.imageUrl),
      category: DINGRY_SWEAT_PRODUCT_IDS.has(seedIdNum)
        ? "Sweats"
        : DINGRY_TEE_PRODUCT_IDS.has(seedIdNum)
          ? "Tee"
          : DINGRY_JERSEY_PRODUCT_IDS.has(seedIdNum)
            ? "Jersey"
            : genericCategory
              ? seed.category
              : current.category,
      name: current.name.includes(" — ") ? seed.name : current.name,
      variant: current.variant.trim() || seed.variant,
      description: current.description.trim() || seed.description,
      sku: genericSku ? seed.sku : current.sku,
      sizes: current.sizes.length > 0 ? current.sizes : [...seed.sizes],
      price: current.price,
      stock: current.stock,
    };
  }
  return {
    ...seed,
    ...current,
    imageUrl: canonicalImage ?? current.imageUrl,
    sku: genericSku ? seed.sku : current.sku,
    variant: current.variant || seed.variant,
    description: current.description || seed.description,
    category: genericCategory ? seed.category : current.category,
    name: current.name.includes(" — ") ? seed.name : current.name,
    sizes: current.sizes.length > 0 ? current.sizes : [...seed.sizes],
  };
}

function migrateStore(raw: AdminStore): AdminStore {
  const existing = raw.products
    .map(normalizeProduct)
    .filter((item): item is AdminProduct => item !== null);
  const byId = new Map(existing.map((item) => [item.id, item]));

  if (raw.version === STORE_VERSION && existing.length > 0) {
    const mergedSeed = SEEDED_PRODUCTS.map((seed) => mergeSeedProduct(seed, byId.get(seed.id)));
    const extras = existing.filter((item) => !SEEDED_PRODUCTS.some((seed) => seed.id === item.id));
    return {
      version: STORE_VERSION,
      products: [...mergedSeed, ...extras],
      orders: raw.orders,
    };
  }

  const mergedSeed = SEEDED_PRODUCTS.map((seed) => mergeSeedProduct(seed, byId.get(seed.id)));
  const extras = existing.filter((item) => !SEEDED_PRODUCTS.some((seed) => seed.id === item.id));

  return {
    version: STORE_VERSION,
    products: [...mergedSeed, ...extras],
    orders: raw.orders,
  };
}

function normalizeStore(value: AdminStore): AdminStore {
  return migrateStore({
    version: typeof value.version === "number" ? value.version : 0,
    products: Array.isArray(value.products) ? value.products : [],
    orders: Array.isArray(value.orders) ? value.orders : [],
  });
}

/** Lecture seule : aucune écriture Blob (catalogue, devis, findOrder). */
export async function loadStoreReadOnly(): Promise<AdminStore> {
  const snapshot = await readStoreSnapshot();
  if (snapshot === "missing") {
    return normalizeStore(createSeededStore());
  }
  return snapshot.store;
}

async function ensureInitialStore(): Promise<AdminStore> {
  const seeded = normalizeStore(createSeededStore());
  try {
    await writeStoreSnapshot(seeded, null);
    await seedCatalogStockFromProducts(seeded.products);
    return seeded;
  } catch (error) {
    if (isStoreWriteConflict(error)) {
      const again = await readStoreSnapshot();
      if (again !== "missing") return again.store;
    }
    throw error;
  }
}

/** Charge le magasin ; peut créer le fichier initial (admin, écritures). */
export async function loadStore(): Promise<AdminStore> {
  const snapshot = await readStoreSnapshot();
  if (snapshot === "missing") {
    return ensureInitialStore();
  }
  return snapshot.store;
}

function safeFileName(name: string): string {
  const base = name.trim() || "image";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "L'image doit être convertie en WebP avant l'enregistrement.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image trop lourde (1 Mo maximum après conversion).";
  }
  return null;
}

export async function uploadProductImage(
  productId: string,
  file: File,
): Promise<{ imageUrl: string; blobUrl: string | null; blobPathname: string | null }> {
  const filename = `${safeFileName(file.name).replace(/\.[^.]+$/, "") || "image"}.webp`;
  const pathname = `dingry/products/${productId}/${filename}`;

  if (isBlobConfigured()) {
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: "image/webp",
    });
    return {
      imageUrl: blob.url,
      blobUrl: blob.url,
      blobPathname: blob.pathname,
    };
  }

  if (!useLocalStoreFiles()) {
    throw new StoreUnavailableError();
  }

  await mkdir(LOCAL_UPLOADS_DIR, { recursive: true });
  const localName = `${productId}-${Date.now()}-${filename}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(LOCAL_UPLOADS_DIR, localName), bytes);
  return {
    imageUrl: `/admin-uploads/${localName}`,
    blobUrl: null,
    blobPathname: null,
  };
}

async function deleteLocalUpload(imageUrl: string): Promise<void> {
  if (!imageUrl.startsWith("/admin-uploads/")) return;
  const relative = imageUrl.replace("/admin-uploads/", "");
  const filePath = path.join(LOCAL_UPLOADS_DIR, path.basename(relative));
  try {
    await unlink(filePath);
  } catch {
    // fichier déjà absent
  }
}

export async function deleteProductImage(product: AdminProduct): Promise<void> {
  if (product.blobUrl) {
    await del(product.blobUrl);
    return;
  }
  if (product.blobPathname) {
    await del(product.blobPathname);
    return;
  }
  await deleteLocalUpload(product.imageUrl);
}

function nextProductId(products: AdminProduct[]): string {
  const max = products.reduce((current, item) => {
    const value = Number(item.id);
    return Number.isInteger(value) && value > current ? value : current;
  }, 24);
  return String(max + 1);
}

export type ProductInput = {
  sku: string;
  name: string;
  variant: string;
  description: string;
  category: ProductCategory;
  price: number;
  sizes: ProductSize[];
  stock: number;
};

export async function createProduct(input: ProductInput & { file: File }): Promise<AdminProduct> {
  const snapshot = await readStoreSnapshot();
  const base = snapshot === "missing" ? normalizeStore(createSeededStore()) : snapshot.store;
  const id = nextProductId(base.products);
  const uploaded = await uploadProductImage(id, input.file);
  const product: AdminProduct = {
    id,
    sku: input.sku,
    name: input.name,
    variant: input.variant,
    description: input.description,
    category: input.category,
    price: input.price,
    sizes: input.sizes,
    stock: input.stock,
    imageUrl: uploaded.imageUrl,
    blobUrl: uploaded.blobUrl,
    blobPathname: uploaded.blobPathname,
    createdAt: new Date().toISOString(),
  };

  return withStoreOptimistic((store) => {
    store.products = [product, ...store.products];
    return { store, result: product };
  }).then(async (created) => {
    await seedStockIfMissing(Number(created.id), created.stock);
    return created;
  });
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput> & { stockDelta?: number },
  file?: File,
): Promise<AdminProduct | null> {
  let uploaded: Awaited<ReturnType<typeof uploadProductImage>> | undefined;
  let previous: AdminProduct | undefined;
  let fields = { ...input };

  const productId = Number(id);
  if (typeof fields.stockDelta === "number" && Number.isInteger(productId) && productId > 0) {
    const adjusted = await adjustStock(productId, fields.stockDelta);
    if (!adjusted.ok) {
      throw new StoreConflictError();
    }
    fields = { ...fields, stock: adjusted.quantity, stockDelta: undefined };
  } else if (typeof fields.stock === "number" && Number.isInteger(productId) && productId > 0) {
    const targetStock = fields.stock;
    const snapshot = await readStoreSnapshot();
    const current = snapshot === "missing" ? null : snapshot.store.products.find((p) => p.id === id);
    const redisQty = await readStockQuantity(productId);
    const baseline =
      redisQty === "missing" || redisQty === "unavailable"
        ? (current?.stock ?? targetStock)
        : redisQty;
    const delta = targetStock - baseline;
    if (delta !== 0) {
      const adjusted = await adjustStock(productId, delta);
      if (!adjusted.ok) {
        throw new StoreConflictError();
      }
      fields = { ...fields, stock: adjusted.quantity };
    }
    await seedStockIfMissing(productId, targetStock);
  }

  if (file) {
    const snapshot = await readStoreSnapshot();
    const base = snapshot === "missing" ? null : snapshot.store;
    previous = base?.products.find((item) => item.id === id);
    if (!previous) return null;
    uploaded = await uploadProductImage(id, file);
  }

  return withStoreOptimistic((store) => {
    const product = store.products.find((item) => item.id === id);
    if (!product) {
      return { store, result: null, skipWrite: true };
    }

    if (typeof fields.sku === "string") product.sku = fields.sku;
    if (typeof fields.name === "string") product.name = fields.name;
    if (typeof fields.variant === "string") product.variant = fields.variant;
    if (typeof fields.description === "string") product.description = fields.description;
    if (fields.category) product.category = fields.category;
    if (typeof fields.price === "number") product.price = fields.price;
    if (fields.sizes) product.sizes = fields.sizes;
    if (typeof fields.stock === "number") {
      product.stock = Math.max(0, Math.floor(fields.stock));
    }

    if (uploaded) {
      product.imageUrl = uploaded.imageUrl;
      product.blobUrl = uploaded.blobUrl;
      product.blobPathname = uploaded.blobPathname;
    }

    return { store, result: product };
  }).then(async (updated) => {
    if (updated && file && previous) {
      await deleteProductImage(previous);
    }
    return updated;
  });
}

export async function updateProductStock(id: string, nextStock: number): Promise<AdminProduct | null> {
  return updateProduct(id, { stock: nextStock });
}

export async function removeProduct(id: string): Promise<boolean> {
  const removed = await withStoreOptimistic((store) => {
    const product = store.products.find((item) => item.id === id);
    if (!product) {
      return { store, result: null, skipWrite: true };
    }
    const copy = { ...product, sizes: [...product.sizes] };
    store.products = store.products.filter((item) => item.id !== id);
    return { store, result: copy };
  });

  if (!removed) return false;
  await deleteProductImage(removed);
  return true;
}

export async function findOrder(id: string): Promise<AdminOrder | undefined> {
  const snapshot = await readStoreSnapshot();
  if (snapshot === "missing") return undefined;
  return snapshot.store.orders.find((item) => item.id === id);
}

export async function insertOrderIfNew(order: AdminOrder): Promise<boolean> {
  return withStoreOptimistic((store) => {
    if (store.orders.some((item) => item.id === order.id)) {
      return { store, result: false, skipWrite: true };
    }
    store.orders = [order, ...store.orders];
    return { store, result: true };
  });
}

export async function upsertOrder(order: AdminOrder): Promise<AdminOrder> {
  return withStoreOptimistic((store) => {
    const index = store.orders.findIndex((item) => item.id === order.id);
    if (index >= 0) {
      store.orders[index] = order;
    } else {
      store.orders = [order, ...store.orders];
    }
    return { store, result: order };
  });
}

export type PatchOrderResult = { order: AdminOrder | null; changed: boolean };

/** Comparaison champ par champ sur le patch (valeurs primitives / références explicites). */
export function orderPatchHasChanges(current: AdminOrder, patch: Partial<AdminOrder>): boolean {
  for (const key of Object.keys(patch) as (keyof AdminOrder)[]) {
    if (patch[key] !== current[key]) return true;
  }
  return false;
}

/** Met à jour une commande existante sans écraser les champs non mentionnés (version relue). */
export async function patchOrder(
  orderId: string,
  mutate: (current: AdminOrder) => Partial<AdminOrder>,
): Promise<PatchOrderResult> {
  return withStoreOptimistic<PatchOrderResult>((store) => {
    const index = store.orders.findIndex((item) => item.id === orderId);
    if (index < 0) {
      return { store, result: { order: null, changed: false }, skipWrite: true };
    }
    const current = store.orders[index];
    const patch = mutate(current);
    if (Object.keys(patch).length === 0) {
      return { store, result: { order: current, changed: false }, skipWrite: true };
    }
    if (!orderPatchHasChanges(current, patch)) {
      return { store, result: { order: current, changed: false }, skipWrite: true };
    }
    store.orders[index] = { ...current, ...patch };
    return { store, result: { order: store.orders[index], changed: true } };
  });
}
```

### FILE: lib/admin/types.ts
```
export const PRODUCT_SIZES = ["S", "M", "L", "XL", "TU"] as const;

export type ProductSize = (typeof PRODUCT_SIZES)[number];

export type OrderStatus = "En attente" | "Expédié" | "Livré" | "À vérifier";

/** Chaîne du bouton « avancer le statut » (sans « À vérifier »). */
export const FULFILLMENT_STATUSES: OrderStatus[] = ["En attente", "Expédié", "Livré"];

export const ORDER_STATUSES: OrderStatus[] = [...FULFILLMENT_STATUSES, "À vérifier"];

/** Catégories admin (back-office). Libellé boutique : voir `lib/shop-catalog.ts`. */
export const PRODUCT_CATEGORIES = ["Tee", "Hoodie", "Hoodie zippé", "Sweats", "Caps", "Jersey"] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export type AdminProduct = {
  id: string;
  sku: string;
  name: string;
  variant: string;
  description: string;
  category: ProductCategory;
  price: number;
  sizes: ProductSize[];
  stock: number;
  imageUrl: string;
  blobUrl: string | null;
  blobPathname: string | null;
  createdAt: string;
};

export type CatalogProduct = {
  id: number;
  sku: string;
  name: string;
  variant: string;
  description: string;
  category: ProductCategory;
  price: number;
  image: string;
  sizes: ProductSize[];
  stock: number;
};

export type AdminOrder = {
  id: string;
  customerName: string;
  email: string;
  total: number;
  items: string[];
  status: OrderStatus;
  createdAt: string;
  source: "paypal" | "demo";
  shippingName?: string;
  shippingAddress?: string;
  captureId?: string;
  /** Lignes utilisées pour le décrément Redis (reconciliation). */
  stockLines?: { productId: number; qty: number }[];
  /** Décrément Redis en attente ou en échec. */
  stockPending?: boolean;
  /** Décrément Redis confirmé (double garde-fou avec dingry:stock-applied). */
  stockApplied?: boolean;
  /** Motifs du statut « À vérifier » (cumulables). */
  reviewReasons?: ("stock" | "adresse")[];
};

export type AdminStore = {
  version: number;
  products: AdminProduct[];
  orders: AdminOrder[];
};

export const STORE_VERSION = 4;

export function isProductSize(value: string): value is ProductSize {
  return (PRODUCT_SIZES as readonly string[]).includes(value);
}

export function isProductCategory(value: string): value is ProductCategory {
  return (PRODUCT_CATEGORIES as readonly string[]).includes(value);
}

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function nextOrderStatus(status: OrderStatus): OrderStatus {
  if (status === "À vérifier") {
    return status;
  }
  const index = FULFILLMENT_STATUSES.indexOf(status);
  if (index < 0) return "En attente";
  return FULFILLMENT_STATUSES[(index + 1) % FULFILLMENT_STATUSES.length];
}

export function toCatalogProduct(product: AdminProduct): CatalogProduct | null {
  const id = Number(product.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  return {
    id,
    sku: product.sku,
    name: product.name,
    variant: product.variant,
    description: product.description,
    category: product.category,
    price: product.price,
    image: product.imageUrl,
    sizes: product.sizes,
    stock: product.stock,
  };
}
```

### FILE: lib/order-stock-finalize.ts
```
import { patchOrder } from "@/lib/admin/store";
import type { AdminOrder } from "@/lib/admin/types";
import { mergeReviewReasons } from "@/lib/order-review";
import {
  alertStockVerification,
  applyCheckoutStock,
  type StockLine,
} from "@/lib/stock";

export const RECONCILE_BATCH_LIMIT = 50;
/** Marge avant la coupure Vercel (`maxDuration` 60 s sur la route). */
export const RECONCILE_DEADLINE_MS = 45_000;

export function stockPatchAfterApply(current: AdminOrder): Partial<AdminOrder> {
  if (!current.stockPending) return {};
  return {
    stockPending: false,
    stockApplied: true,
  };
}

export function stockPatchAfterShort(current: AdminOrder): Partial<AdminOrder> {
  if (!current.stockPending) return {};
  const stockFlags = {
    stockPending: false,
    stockApplied: false,
    reviewReasons: mergeReviewReasons(current.reviewReasons, "stock"),
  };
  if (current.status === "En attente") {
    return { ...stockFlags, status: "À vérifier" as const };
  }
  if (current.status === "À vérifier") {
    return stockFlags;
  }
  return { stockPending: false, stockApplied: false };
}

export function isStockReconcileCandidate(order: AdminOrder): boolean {
  if (!order.stockPending || order.stockApplied) return false;
  if (order.status === "À vérifier") return false;
  return (order.stockLines?.length ?? 0) > 0;
}

function linesForOrder(order: AdminOrder): StockLine[] {
  return order.stockLines ?? [];
}

/** Finalise le décrément Redis (client, webhook ou cron). */
export async function finalizeOrderStock(order: AdminOrder): Promise<AdminOrder> {
  if (!order.stockPending || order.stockApplied) {
    return order;
  }

  const lines = linesForOrder(order);
  if (lines.length === 0) {
    console.error("[stock] lignes manquantes pour commande", order.id);
    return order;
  }

  const result = await applyCheckoutStock(order.id, lines);

  if (result === "applied") {
    const { order: patched } = await patchOrder(order.id, (current) => stockPatchAfterApply(current));
    return patched ?? order;
  }

  if (result === "short") {
    const { order: patched, changed } = await patchOrder(order.id, (current) =>
      stockPatchAfterShort(current),
    );
    const next = patched ?? order;
    if (changed) {
      alertStockVerification(order.id, "short");
    }
    return next;
  }

  alertStockVerification(order.id, "unavailable");
  return order;
}

export async function reconcilePendingStockOrders(options?: {
  limit?: number;
  deadlineMs?: number;
}): Promise<{
  scanned: number;
  processed: number;
  applied: number;
  short: number;
  stillPending: number;
  skippedNoLines: number;
  timedOut: boolean;
}> {
  const limit = Math.min(
    Math.max(1, options?.limit ?? RECONCILE_BATCH_LIMIT),
    RECONCILE_BATCH_LIMIT,
  );
  const deadline = Date.now() + (options?.deadlineMs ?? RECONCILE_DEADLINE_MS);

  const { listOrders } = await import("@/lib/admin/orders");
  const orders = await listOrders();
  const pending = orders.filter((order) => order.stockPending && !order.stockApplied);
  const withLines = pending.filter((order) => isStockReconcileCandidate(order));
  const skippedNoLines = pending.length - withLines.length;

  if (skippedNoLines > 0) {
    console.error("[cron] stock-reconcile missing-lines", { skippedNoLines });
  }

  const batch = withLines.slice(0, limit);
  let applied = 0;
  let short = 0;
  let processed = 0;
  let timedOut = false;

  for (const order of batch) {
    if (Date.now() > deadline) {
      timedOut = true;
      break;
    }
    processed += 1;
    const beforePending = order.stockPending;
    const beforeApplied = order.stockApplied;
    const after = await finalizeOrderStock(order);
    if (beforePending && !after.stockPending) {
      if (after.stockApplied && !beforeApplied) applied += 1;
      else if (!after.stockApplied) short += 1;
    }
  }

  const afterOrders = await listOrders();
  const stillPending = afterOrders.filter(
    (order) => order.stockPending && !order.stockApplied,
  ).length;

  if (timedOut) {
    console.error("[cron] stock-reconcile timed-out", {
      processed,
      applied,
      short,
      stillPending,
      skippedNoLines,
    });
  }

  if (stillPending > 0) {
    console.error("[cron] stock-reconcile backlog", {
      stillPending,
      applied,
      short,
      processed,
      skippedNoLines,
      timedOut,
    });
  }

  return {
    scanned: pending.length,
    processed,
    applied,
    short,
    stillPending,
    skippedNoLines,
    timedOut,
  };
}
```

### FILE: lib/admin/orders.ts
```
import { loadStoreReadOnly } from "@/lib/admin/store";
import type { AdminOrder } from "@/lib/admin/types";

export async function listOrders(): Promise<AdminOrder[]> {
  const store = await loadStoreReadOnly();
  return [...store.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
```

### FILE: app/api/admin/products/route.ts
```
import { NextResponse } from "next/server";
import { isBlobConfigured, requireAdmin } from "@/lib/admin/auth";
import { parseProductFields } from "@/lib/admin/parse-product";
import { createProduct, loadStore, StoreConflictError, StoreUnavailableError, validateImageFile } from "@/lib/admin/store";
import { readStockQuantity } from "@/lib/stock";
import type { ParsedProductFields } from "@/lib/admin/parse-product";

export const runtime = "nodejs";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const store = await loadStore();
    const products = await Promise.all(
      store.products.map(async (product) => {
        const id = Number(product.id);
        if (!Number.isInteger(id) || id <= 0) return product;
        const live = await readStockQuantity(id);
        if (live === "missing" || live === "unavailable") return product;
        return { ...product, stock: live };
      }),
    );
    return NextResponse.json({
      products,
      blobEnabled: isBlobConfigured(),
    });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      console.error("Produits admin injoignables", error.name);
      return NextResponse.json({ error: "Enregistrement indisponible." }, { status: 503 });
    }
    if (error instanceof StoreConflictError) {
      return NextResponse.json({ error: "Conflit d'enregistrement. Réessayez." }, { status: 503 });
    }
    return NextResponse.json({ error: "Impossible de charger les produits." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formulaire invalide." }, { status: 400 });
  }

  const parsed = parseProductFields(formData);
  if (parsed.error || !parsed.fields.sku || !parsed.fields.name || !parsed.fields.category || parsed.fields.price === undefined || parsed.fields.stock === undefined || !parsed.fields.sizes) {
    return NextResponse.json({ error: parsed.error || "Champs invalides." }, { status: 400 });
  }

  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "Une image est requise." }, { status: 400 });
  }

  const imageError = validateImageFile(image);
  if (imageError) {
    return NextResponse.json({ error: imageError }, { status: 400 });
  }

  const fields = parsed.fields as ParsedProductFields;

  try {
    const product = await createProduct({
      sku: fields.sku,
      name: fields.name,
      variant: fields.variant ?? "",
      description: fields.description ?? "",
      category: fields.category,
      price: fields.price,
      sizes: fields.sizes,
      stock: fields.stock,
      file: image,
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      console.error("Création produit indisponible", error.name);
      return NextResponse.json({ error: "Enregistrement indisponible." }, { status: 503 });
    }
    if (error instanceof StoreConflictError) {
      return NextResponse.json({ error: "Conflit d'enregistrement. Réessayez." }, { status: 503 });
    }
    console.error("Création produit", error instanceof Error ? error.name : typeof error);
    return NextResponse.json({ error: "Impossible d'enregistrer le produit." }, { status: 500 });
  }
}
```

### FILE: app/api/admin/products/[id]/route.ts
```
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { parseProductFields } from "@/lib/admin/parse-product";
import { loadStore, removeProduct, updateProduct, validateImageFile } from "@/lib/admin/store";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
  }

  const store = await loadStore();
  const current = store.products.find((item) => item.id === id);
  if (!current) {
    return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const parsed = parseProductFields(formData, { partial: true });
      if (parsed.error) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }

      const image = formData.get("image");
      let file: File | undefined;
      if (image instanceof File && image.size > 0) {
        const imageError = validateImageFile(image);
        if (imageError) {
          return NextResponse.json({ error: imageError }, { status: 400 });
        }
        file = image;
      }

      const product = await updateProduct(id, parsed.fields, file);
      return NextResponse.json({ product });
    }

    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.stockDelta === "number") {
      const product = await updateProduct(id, { stockDelta: body.stockDelta });
      return NextResponse.json({ product });
    }

    const parsed = parseProductFields(body, { partial: true });
    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const product = await updateProduct(id, parsed.fields);
    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "Impossible de mettre à jour le produit." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    const removed = await removeProduct(id);
    if (!removed) {
      return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Impossible de supprimer le produit." },
      { status: 500 },
    );
  }
}
```

### FILE: app/api/admin/orders/[id]/route.ts
```
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { listOrders } from "@/lib/admin/orders";
import { upsertOrder } from "@/lib/admin/store";
import { isOrderStatus, nextOrderStatus } from "@/lib/admin/types";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const orders = await listOrders();
  const current = orders.find((order) => order.id === id);
  if (!current) {
    return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  }

  let requestedStatus: string | undefined;
  try {
    const body = (await request.json()) as { status?: unknown };
    requestedStatus = typeof body.status === "string" ? body.status : undefined;
  } catch {
    requestedStatus = undefined;
  }

  const status = requestedStatus && isOrderStatus(requestedStatus)
    ? requestedStatus
    : current.status === "À vérifier"
      ? current.status
      : nextOrderStatus(current.status);

  if (current.status === "À vérifier" && !requestedStatus) {
    return NextResponse.json(
      { error: "Commande à vérifier : indiquez un statut explicitement." },
      { status: 400 },
    );
  }

  const order = await upsertOrder({ ...current, status });
  return NextResponse.json({ order });
}
```

### FILE: app/api/admin/totp/route.ts
```
import { NextResponse } from "next/server";
import { getTotpEnrollmentQr, isTotpEnrollmentPublic } from "@/lib/admin/totp";

export const runtime = "nodejs";

export async function GET() {
  if (!isTotpEnrollmentPublic()) {
    return NextResponse.json(
      { showEnrollment: false },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  try {
    const qrDataUrl = await getTotpEnrollmentQr();
    return NextResponse.json(
      { showEnrollment: true, qrDataUrl },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Impossible de générer le QR Google Authenticator." },
      { status: 500 },
    );
  }
}
```

### FILE: app/api/admin/session/route.ts
```
import { NextResponse } from "next/server";
import { isAdminAuthenticated, isBlobConfigured } from "@/lib/admin/auth";

export const runtime = "nodejs";

export async function GET() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    blobEnabled: isBlobConfigured(),
  });
}
```

### FILE: lib/request-ip.ts
```
/**
 * IP client sur Vercel, sans proxy Cloudflare devant le domaine.
 * `cf-connecting-ip` est ignoré : un client peut l'inventer en appelant `*.vercel.app`.
 * `x-forwarded-for` n'est utilisé qu'en dernier recours (premier élément).
 */
const IP_HEADERS = ["x-vercel-forwarded-for", "x-real-ip", "x-forwarded-for"] as const;
const IP_PATTERN = /^[a-fA-F0-9:.]+$/;

export function clientIp(request: Request): string {
  for (const name of IP_HEADERS) {
    const raw = request.headers.get(name);
    if (!raw) continue;
    const address = raw.split(",")[0]?.trim() ?? "";
    if (address.length > 0 && address.length <= 80 && IP_PATTERN.test(address)) return address;
  }
  return "unknown";
}
```

### FILE: lib/http.ts
```
import { NextResponse } from "next/server";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

/** Réponses API JSON sans mise en cache (erreurs incluses). */
export function jsonNoStore(
  body: unknown,
  init?: ResponseInit & { status?: number },
): NextResponse {
  return NextResponse.json(body, {
    ...init,
    headers: { ...NO_STORE_HEADERS, ...init?.headers },
  });
}
```

### FILE: next.config.mjs
```
/** @type {import('next').NextConfig} */

const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js (inline + eval en dev), Turnstile, PayPal, Vercel Analytics
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com https://*.paypal.com https://*.paypalobjects.com https://*.sandbox.paypal.com https://va.vercel-scripts.com",
  // Feuille Google Fonts importée dans app/globals.css
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  // Cloudinary, Unsplash et le reste des visuels HTTPS
  "img-src 'self' data: https:",
  // Turnstile, PayPal et Vercel Analytics. Upstash n’est appelé que par le serveur.
  "connect-src 'self' https://challenges.cloudflare.com https://*.paypal.com https://*.paypalobjects.com https://*.sandbox.paypal.com https://vitals.vercel-insights.com",
  // Iframe Turnstile + boutons / carte PayPal
  "frame-src https://challenges.cloudflare.com https://*.paypal.com https://*.paypalobjects.com https://*.sandbox.paypal.com",
  "worker-src 'self' blob:",
  "form-action 'self' https://*.paypal.com https://*.sandbox.paypal.com",
  // Équivalent CSP de X-Frame-Options: DENY
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
```

### FILE: scripts/check-prod-env.ts
```
/**
 * Contrôle des variables Vercel Production avant déploiement (sans afficher les secrets).
 * Usage : npx tsx scripts/check-prod-env.ts
 */

import { MIN_CRON_SECRET_LENGTH } from "../lib/cron-auth";

type Check = { name: string; ok: boolean; hint: string };

function present(name: string, minLength = 1): Check {
  const value = process.env[name]?.trim() ?? "";
  const ok = value.length >= minLength;
  return {
    name,
    ok,
    hint: ok ? "ok" : minLength > 1 ? `requis (≥ ${minLength} caractères)` : "requis",
  };
}

function paypalLive(): Check {
  const env = process.env.PAYPAL_ENV?.trim().toLowerCase() ?? "";
  const sandbox = env === "sandbox";
  return {
    name: "PAYPAL_ENV",
    ok: !sandbox && env !== "sandbox",
    hint: sandbox ? "doit être live (ou absent) en prod" : "ok",
  };
}

function stockPrefix(): Check {
  const prefix = process.env.STOCK_KEY_PREFIX?.trim();
  if (!prefix) {
    return { name: "STOCK_KEY_PREFIX", ok: true, hint: "ok (défaut dingry:)" };
  }
  const ok = prefix === "dingry:";
  return {
    name: "STOCK_KEY_PREFIX",
    ok,
    hint: ok ? "ok" : 'doit être "dingry:" en prod',
  };
}

function turnstileHostname(): Check {
  const raw = process.env.TURNSTILE_EXPECTED_HOSTNAME?.trim() ?? "";
  const ok = raw.length > 0;
  return {
    name: "TURNSTILE_EXPECTED_HOSTNAME",
    ok,
    hint: ok ? "ok" : 'requis en prod (ex. "dingry.com,www.dingry.com")',
  };
}

function main(): void {
  const checks: Check[] = [
    present("NEXT_PUBLIC_PAYPAL_CLIENT_ID"),
    present("PAYPAL_CLIENT_SECRET"),
    present("PAYPAL_WEBHOOK_ID", 8),
    paypalLive(),
    present("ADMIN_TOTP_SECRET", 16),
    present("ADMIN_SESSION_SECRET", 32),
    present("CRON_SECRET", MIN_CRON_SECRET_LENGTH),
    present("UPSTASH_REDIS_REST_URL"),
    present("UPSTASH_REDIS_REST_TOKEN"),
    present("BLOB_READ_WRITE_TOKEN"),
    present("TURNSTILE_SECRET_KEY"),
    present("NEXT_PUBLIC_TURNSTILE_SITE_KEY"),
    turnstileHostname(),
    present("RESEND_API_KEY"),
    present("OPS_ALERT_EMAIL"),
    present("OPS_ALERT_FROM"),
    stockPrefix(),
  ];

  const failed = checks.filter((check) => !check.ok);
  for (const check of checks) {
    console.log(`${check.ok ? "✓" : "✗"} ${check.name} — ${check.hint}`);
  }

  if (failed.length > 0) {
    console.error(`\n${failed.length} contrôle(s) en échec.`);
    process.exit(1);
  }
  console.log("\nContrôles prod OK (valeurs non affichées).");
}

main();
```

### FILE: scripts/seed-stock.ts
```
/**
 * Seed Redis stock depuis le catalogue Blob (quantités admin → clés dingry:stock:*).
 *
 * Local (mêmes vars que l’env cible) :
 *   npm run seed-stock
 *
 * Preview Vercel — tirer les secrets puis seed la base Preview :
 *   vercel env pull .env.preview --environment=preview
 *   npm run seed-stock
 *   (ne pas committer .env.preview)
 *
 * Requis : UPSTASH_REDIS_REST_*, BLOB_READ_WRITE_TOKEN, pas de STOCK_KEY_PREFIX=test:
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";

const root = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.join(root, "..");
loadDotenv({ path: path.join(projectDir, ".env") });
loadDotenv({ path: path.join(projectDir, ".env.local"), override: true });
loadDotenv({ path: path.join(projectDir, ".env.preview"), override: true });
if (process.env.STOCK_KEY_PREFIX?.trim().startsWith("test:")) {
  delete process.env.STOCK_KEY_PREFIX;
}

async function main() {
  const prefix = process.env.STOCK_KEY_PREFIX?.trim() ?? "";
  if (prefix.startsWith("test:")) {
    console.error("Refus : STOCK_KEY_PREFIX=test: — retire-le pour seed prod/preview (dingry:).");
    process.exit(1);
  }

  const { loadStoreReadOnly } = await import("../lib/admin/store");
  const { getSharedRedis } = await import("../lib/ratelimit");
  const { seedCatalogStockFromProducts, stockKeyPrefix } = await import("../lib/stock");

  const client = getSharedRedis();
  if (!client) {
    console.error("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN manquants ou invalides.");
    process.exit(1);
  }

  const store = await loadStoreReadOnly();
  await seedCatalogStockFromProducts(store.products);

  const pattern = `${stockKeyPrefix()}stock:*`;
  const keys = await client.keys(pattern);
  console.log(`Stock initialisé pour ${store.products.length} produits (${keys.length} clés ${pattern}).`);
  if (keys.length === 0) {
    console.error("Aucune clé Redis créée — vérifie Upstash et les ids produits du catalogue.");
    process.exit(1);
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.name : error);
  process.exit(1);
});
```

### FILE: RUNBOOK-OPS.md
```
# Runbook ops DINGRY — paiements & stock

Une page pour les incidents entre le lancement et le quotidien. **Pas de données client dans les alertes e-mail** : tout le détail est dans PayPal, le CRM admin ou Redis.

---

## 1. Paiement capturé sans commande CRM

**Symptômes :** alerte « Paiement sans brouillon », « montant refusé COMPLETED », « Commande PayPal introuvable » ; client a payé ; rien (ou incomplet) dans `/admin` commandes.

**Source de vérité Redis :** clés `dingry:paypal-orphan:{orderId}` (sans TTL). Valeur JSON : `{ reason, recordedAt }`.

**Étapes :**

1. Ouvrir PayPal (sandbox ou live) → commande `orderId` → vérifier capture, montant, adresse, `custom_id` (digest panier).
2. Upstash → chercher `dingry:paypal-draft:{orderId}` : si absent, le panier serveur est perdu (Redis expiré / preview partagée) → régularisation manuelle ou remboursement.
3. Si brouillon ou digest OK : relancer enregistrement via **capture client** (checkout avec même panier impossible) → créer commande admin **demo** interdit ; préférer **remboursement PayPal** ou patch manuel CRM + stock si vous assumez la vente.
4. Après régularisation (commande CRM créée et cohérente) : supprimer l’orphelin Redis `DEL dingry:paypal-orphan:{orderId}` (automatique si `persistPayPalPayment` réussit).

**Prévention :** preview/prod Redis séparés ; webhook 200 + alerte une fois ; brouillon TTL 30 j.

---

## 2. Redis indisponible ou perdu

**Symptômes :** checkout 503, stock admin incohérent, `stockPending` sur commandes, cron stock-reconcile backlog.

**Étapes :**

1. Vérifier Upstash (quota, URL/token Vercel).
2. **Ne pas** seed prod depuis preview. `npm run seed-stock` uniquement sur l’env cible après contrôle catalogue Blob.
3. Cron : `POST /api/cron/stock-reconcile` avec `Authorization: Bearer {CRON_SECRET}` (≥ 32 car.).
4. Commandes `stockPending` : laisser le cron rejouer ; si rupture → statut **À vérifier** + motif `stock` dans admin.

---

## 3. Stock divergent (admin vs Redis)

**Symptômes :** vente refusée alors que admin affiche du stock ; ou inverse.

**Rappel :** le stock checkout est **Redis** (`dingry:stock:{productId}`), pas le champ Blob seul.

**Étapes :**

1. Admin → produit → ajuster stock (écrit Redis + Blob selon flux).
2. `npm run seed-stock` seulement si vous réinitialisez volontairement depuis le catalogue.
3. Commande **À vérifier** (`reviewReasons: stock`) : corriger stock puis avancer le statut manuellement.

---

## 4. Remboursement depuis le tableau de bord PayPal

**Symptômes :** alerte « Remboursement PayPal » (type + capture + commande si connue).

**Étapes :**

1. Identifier la commande CRM par `orderId` / `captureId`.
2. Mettre à jour le statut admin (note interne) ; **ne pas** réincrémenter stock automatiquement — ajuster stock manuellement si la pièce revient en inventaire.
3. Pas de webhook « annulation CRM » automatique : traitement humain.

---

## 5. Adresse livraison absente

**Symptômes :** commande **À vérifier**, motif `adresse` ; alerte ops.

**Étapes :**

1. PayPal → adresse client ; compléter `shippingAddress` / `shippingName` via patch admin si vous ajoutez ce champ, ou contacter le client.
2. Résoudre le motif ; passer la commande en **En attente** puis flux normal (stock déjà bloqué si adresse manquante à la capture).

---

## 6. Accès admin perdu (codes de secours épuisés + téléphone)

**Situation :** les 8 codes de secours sont consommés (`hashes` vides dans Blob) ; le téléphone avec Google Authenticator est perdu ou inaccessible. **Il ne reste plus de backup automatique** (pas de régénération au login).

**Procédure (à faire en local / accès Vercel, pas à improviser le jour J) :**

1. Générer un **nouveau** secret TOTP (Base32, ex. via `otpauth` / 1Password) — ne pas réutiliser l’ancien.
2. Vercel Production → **`ADMIN_TOTP_SECRET`** = nouveau secret → redéployer.
3. Vercel Blob (privé) → **supprimer** `dingry/admin/backup-codes.json` (ou vider le store pour repartir sur `missing`).
4. Upstash (optionnel) : `DEL dingry:totp:used:*` si des clés traînent (peu probable).
5. **Réenrôlement :** en local (`npm run dev`, `NODE_ENV=development`), ouvrir `/admin`, scanner le **QR** (`GET /api/admin/totp` — **interdit en prod**). En prod sans QR : saisir le secret manuellement dans l’app Authenticator (même entrée que le QR).
6. Premier login TOTP réussi → les **8 nouveaux codes de secours** s’affichent **une fois** : les archiver hors ligne.
7. Vérifier **`ADMIN_SESSION_SECRET`** inchangé ou régénéré si compromission suspectée.

**Horloge TOTP :** fenêtre **±30 s** (`window: 1`). Si le téléphone est décalé de >30 s, les codes échouent et **comptent** dans le limiteur login — synchroniser l’heure (NTP) avant de paniquer.

---

## Contacts & variables critiques

- Alertes : `RESEND_API_KEY`, `OPS_ALERT_EMAIL`, `OPS_ALERT_FROM` — vérifier avec `npm run check:prod-env`.
- PayPal live : `PAYPAL_ENV`, webhook `PAYPAL_WEBHOOK_ID`, URL `/api/paypal/webhook`.
- Admin : `ADMIN_TOTP_SECRET`, `ADMIN_SESSION_SECRET` (≥ 32 car., prod). **Urgence session compromise :** changer `ADMIN_SESSION_SECRET` sur Vercel → tous les cookies admin deviennent invalides (pas de liste de sessions).
- **Rotation TOTP :** changer `ADMIN_TOTP_SECRET` invalide les **codes de secours** existants (hash lié au secret). Régénérer les codes manuellement après rotation (pas d’auto-régénération après épuisement).
- Turnstile : `TURNSTILE_EXPECTED_HOSTNAME` (domaines réels, ex. `dingry.com,www.dingry.com`). Preview : `VERCEL_URL` auto ou `TURNSTILE_PREVIEW_HOST_SUFFIX` (suffixe `.vercel.app` du projet).
- **Login admin bloqué (429 global) :** Upstash → `DEL dingry:admin-login:global` (et éventuellement `dingry:admin-login:ip:<adresse>`). Déclenché après 30 échecs globaux / 15 min (alerte ops).
- **Login admin 503 en local « prod » :** `NODE_ENV=production` + `next start` sans IP proxy réaliste → `clientAddress` = `unknown` → 503 (normal, pas une panne Vercel).

---

## Checklist preview avant bascule 6 nov.

Nominal checkout · Redis coupé · rejeu webhook (idempotence seulement) · montant modifié (doit échouer) · cron stock · adresse vide → À vérifier · test Lua Upstash test · **`npm run check:prod-env` avec les variables exportées depuis Vercel Production** (le script lit `.env` local — le dashboard prod reste la source de vérité).

### Test webhook sandbox — caractères non ASCII (**bloquant J-6**)

Objectif : prouver que **`verify-webhook-signature`** reçoit le **corps brut** PayPal (pas une re-sérialisation JSON) quand le payload contient des caractères non ASCII.

**Isoler le chemin webhook (méthode recommandée).** Fermer l’onglet après approbation est **fragile** : le client peut encore appeler `/api/checkout` avant la fermeture. Pour être sûr que **c’est le webhook** qui crée la commande :

1. Passer un checkout sandbox jusqu’à **capture** (PayPal enregistre l’événement `PAYMENT.CAPTURE.COMPLETED`).
2. S’assurer qu’**aucune commande CRM** n’existe pour cet `orderId` (ne pas laisser le retour boutique finir le flux, **ou** supprimer la commande de test du CRM avant le test).
3. Upstash → vérifier que **`dingry:paypal-draft:{orderId}`** existe encore. Sans brouillon, le webhook part en **« brouillon absent »** (orphelin / alerte) : ce n’est **pas** la preuve `raw`.
4. PayPal Developer → Webhooks → **Resend** sur l’événement `PAYMENT.CAPTURE.COMPLETED` concerné.
5. Logs Vercel **`[paypal-webhook]`** : un **401** n’est émis qu’**avant** toute lecture du brouillon. **Preuve suffisante :** pas de 401 **+** commande CRM **créée par le webhook** avec les caractères attendus.

**Où mettre les accents.** L’événement de capture contient surtout les données **payeur / expédition** PayPal, pas les libellés d’articles personnalisés du panier. Pour tester `raw` avec non-ASCII, mettre l’accent dans le **nom du payeur** ou le **nom sur l’adresse de livraison** du compte acheteur sandbox (modifier le profil sandbox si besoin). En CRM, comparer surtout **`customerName`** (`payerName`) et **`shippingName`** si présent.

**Jeux de caractères minimum** (un run ou plusieurs captures / Resend) :

| Caractère | Exemple |
|-----------|---------|
| é | Éléonore |
| ç | François |
| apostrophe typographique | O’Brien (U+2019 `’`) |
| emoji | prénom sandbox court 🎉 |

**Ne pas confondre statut HTTP et preuve.** Un **200** sur un **Resend** alors que la commande existait déjà ne prouve que l’**idempotence**. Pour la preuve `raw`, viser un Resend (ou premier envoi PayPal) où la commande **n’existait pas** encore, brouillon présent, **pas de 401**.

**Compte-rendu** — **une ligne par variante** avec :

`premier passage | Resend` · statut HTTP · **401 oui/non** dans les logs · nom tel que persisté (`customerName` / `shippingName`) · variante (é, ç, ’, emoji) · **champ source** (payeur / expédition).

**401 sur un événement légitime** — vérifier dans l’ordre :

1. `PAYPAL_WEBHOOK_ID` = webhook **sandbox** sur preview (pas live).
2. OAuth / certificats : credentials **sandbox** + URL API sandbox (`PAYPAL_ENV=sandbox`).
3. Corps **brut** de la requête (byte-for-byte) passé à la vérification — toute re-parse JSON côté route avant verify casse les accents.

Ensuite seulement : autres scénarios checklist (Redis coupé pendant capture, rejeu idempotence, etc.).
```

