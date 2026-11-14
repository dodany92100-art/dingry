import { isPayPalOrderId } from "@/lib/paypal-order-id";

/** Canal postMessage entre la fenêtre PayPal et la page checkout ouverte. */
export const PAYPAL_CHECKOUT_MSG = {
  approved: "dingry:paypal:approved",
  cancelled: "dingry:paypal:cancelled",
} as const;

export type PayPalCheckoutPopupEvent =
  | { type: typeof PAYPAL_CHECKOUT_MSG.approved; orderId: string }
  | { type: typeof PAYPAL_CHECKOUT_MSG.cancelled };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parsePayPalCheckoutPopupEvent(data: unknown): PayPalCheckoutPopupEvent | null {
  if (!isRecord(data) || typeof data.type !== "string") return null;
  if (data.type === PAYPAL_CHECKOUT_MSG.cancelled) {
    return { type: PAYPAL_CHECKOUT_MSG.cancelled };
  }
  if (data.type === PAYPAL_CHECKOUT_MSG.approved && typeof data.orderId === "string") {
    const orderId = data.orderId.trim();
    if (!isPayPalOrderId(orderId)) return null;
    return { type: PAYPAL_CHECKOUT_MSG.approved, orderId };
  }
  return null;
}

export function notifyPayPalCheckoutOpener(event: PayPalCheckoutPopupEvent): boolean {
  if (typeof window === "undefined") return false;
  const opener = window.opener;
  if (!opener || opener.closed) return false;
  try {
    opener.postMessage(event, window.location.origin);
    return true;
  } catch {
    return false;
  }
}

export function openPayPalApprovalPopup(approvalUrl: string): Window | null {
  const w = Math.min(520, window.screen.availWidth - 40);
  const h = Math.min(720, window.screen.availHeight - 80);
  const left = Math.max(0, Math.round((window.screen.availWidth - w) / 2));
  const top = Math.max(0, Math.round((window.screen.availHeight - h) / 2));
  const features = [
    `width=${w}`,
    `height=${h}`,
    `left=${left}`,
    `top=${top}`,
    "menubar=no",
    "toolbar=no",
    "location=yes",
    "status=no",
    "resizable=yes",
    "scrollbars=yes",
  ].join(",");
  return window.open(approvalUrl, "dingry_paypal_checkout", features);
}

export function listenPayPalCheckoutPopup(
  onEvent: (event: PayPalCheckoutPopupEvent) => void,
): () => void {
  function onMessage(messageEvent: MessageEvent) {
    if (messageEvent.origin !== window.location.origin) return;
    const parsed = parsePayPalCheckoutPopupEvent(messageEvent.data);
    if (parsed) onEvent(parsed);
  }
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}