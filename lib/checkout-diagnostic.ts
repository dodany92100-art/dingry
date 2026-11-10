import type { NextResponse } from "next/server";
import { jsonNoStore } from "@/lib/http";

/** Codes diagnostic checkout (logs Vercel + corps JSON `code`). */
export const CHECKOUT_CODES = {
  INVALID: "CHK-01",
  CATALOG_LINE: "CHK-02",
  STOCK: "CHK-03",
  STORE: "CHK-04",
  TURNSTILE: "CHK-05",
  RATE_LIMIT: "CHK-06",
  PAYMENT_UNAVAILABLE: "CHK-07",
  PAYPAL_API: "CHK-08",
  AMOUNT_MISMATCH: "CHK-09",
  FINALIZING: "CHK-10",
  PERSIST_ORPHAN: "CHK-11",
  DRAFT_MISSING: "CHK-12",
} as const;

export type CheckoutDiagCode = (typeof CHECKOUT_CODES)[keyof typeof CHECKOUT_CODES];

/** Codes diagnostic webhook PayPal (`[paypal-webhook]`). */
export const WEBHOOK_CODES = {
  DRAFT: "WHK-12",
  VERIFY: "WHK-13",
  CREDENTIALS: "WHK-14",
  REFUND: "WHK-15",
  CAPTURE_INVALID: "WHK-16",
  PAYPAL_READ: "WHK-17",
  AMOUNT: "WHK-18",
  PERSIST: "WHK-19",
} as const;

export type WebhookDiagCode = (typeof WEBHOOK_CODES)[keyof typeof WEBHOOK_CODES];

export function logCheckoutDiag(
  code: CheckoutDiagCode,
  details: Record<string, string | number | boolean | undefined> = {},
): void {
  console.error("[checkout]", { code, ...details });
}

export function logPayPalWebhookDiag(
  code: WebhookDiagCode,
  scope: string,
  details: Record<string, string | undefined> = {},
): void {
  console.error("[paypal-webhook]", { code, scope, ...details });
}

export function checkoutErrorResponse(
  code: CheckoutDiagCode,
  error: string,
  status: number,
  options?: {
    headers?: Record<string, string>;
    log?: Record<string, string | number | undefined>;
  },
): NextResponse {
  logCheckoutDiag(code, { status, message: error, ...options?.log });
  return jsonNoStore({ error, code }, { status, headers: options?.headers });
}

export function formatClientCheckoutError(error: string, code?: string): string {
  const trimmed = code?.trim();
  if (!trimmed) return error;
  return `${error} (${trimmed})`;
}
