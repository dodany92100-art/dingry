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

export function readVerifiedPayment(
  order: PaypalOrder,
  quote: CheckoutQuote,
  digestAlreadyMatched = false,
): VerifiedPayPalPayment | null {
  if (order.status !== "COMPLETED" || !order.id) return null;
  const unit = order.purchase_units?.[0];
  if (!unit || order.purchase_units?.length !== 1) return null;
  if (unit.custom_id !== quote.digest && (!digestAlreadyMatched || unit.custom_id)) return null;
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
): Promise<"ok" | "invalid" | "unavailable"> {
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
    return response.status >= 500 || response.status === 401 || response.status === 403 ? "unavailable" : "invalid";
  }
  return data?.verification_status === "SUCCESS" ? "ok" : "invalid";
}
