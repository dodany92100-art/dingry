import { loadStoreReadOnly } from "@/lib/admin/store";
import type { AdminOrder } from "@/lib/admin/types";
import { loadPersonalizationProductIds } from "@/lib/atelier-custom-server";
import { resolveCheckoutLine } from "@/lib/checkout-line-resolve";
import type { CheckoutLine, CheckoutQuote } from "@/lib/checkout-quote";
import { PERSONALIZATION_SURCHARGE_EUR } from "@/lib/checkout-draft";
import { DINGRY_ORDERS_INBOX, DINGRY_ORDER_FROM } from "@/lib/dingry-orders-email";
import { isShippingAddressMissing } from "@/lib/order-review";
import { sendOpsAlertOnce, sendResendEmail } from "@/lib/ops-alert";
import type { VerifiedPayPalPayment } from "@/lib/paypal-server";
import { buildShopCatalogSnapshot } from "@/lib/shop-catalog-snapshot";
import { getSharedRedis } from "@/lib/ratelimit";

const CONFIRMATION_REDIS_TTL_SECONDS = 60 * 60 * 24 * 90;

/** Délai max d’attente dans `persistPayPalPayment` (évite la coupure Vercel sans `void`). */
export const CUSTOMER_ORDER_CONFIRMATION_PERSIST_TIMEOUT_MS = 4_000;

export function confirmationSentRedisKey(orderId: string): string {
  return `dingry:order-confirmation-sent:${orderId}`;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatEuroFromCents(cents: number): string {
  const abs = Math.abs(cents);
  const euros = Math.trunc(abs / 100);
  const fraction = String(abs % 100).padStart(2, "0");
  const sign = cents < 0 ? "-" : "";
  return `${sign}${euros},${fraction}\u00a0€`;
}

function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return escapeHtml(iso);
  return escapeHtml(
    new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Europe/Paris",
    }).format(date),
  );
}

function customerEmailUsable(email: string | undefined): email is string {
  const trimmed = email?.trim() ?? "";
  return trimmed.length > 0 && trimmed !== "—" && trimmed.includes("@");
}

export type OrderConfirmationLineDetailed = {
  kind: "detailed";
  description: string;
  size: string;
  qty: number;
  unitPriceLabel: string;
  personalization?: string;
  showPersoSurcharge: boolean;
};

export type OrderConfirmationLineFallback = {
  kind: "fallback";
  text: string;
};

export type OrderConfirmationLine = OrderConfirmationLineDetailed | OrderConfirmationLineFallback;

export async function buildOrderConfirmationLines(
  order: AdminOrder,
  quote: CheckoutQuote,
): Promise<OrderConfirmationLine[]> {
  const store = await loadStoreReadOnly();
  const snapshot = buildShopCatalogSnapshot(store);
  const personalizationProductIds = await loadPersonalizationProductIds();
  const options = { personalizationProductIds };

  const rows: OrderConfirmationLine[] = [];

  for (let index = 0; index < quote.lines.length; index += 1) {
    const line: CheckoutLine = quote.lines[index]!;
    const resolved = resolveCheckoutLine(line, snapshot, options);
    if (!resolved.ok) {
      const fallbackText = order.items[index] ?? order.items[0] ?? "Article";
      rows.push({ kind: "fallback", text: fallbackText });
      continue;
    }

    const personalized = Boolean(line.personalization?.trim());
    rows.push({
      kind: "detailed",
      description: resolved.line.label,
      size: line.size,
      qty: resolved.line.qty,
      unitPriceLabel: formatEuroFromCents(resolved.line.unitCents),
      personalization: line.personalization?.trim() || undefined,
      showPersoSurcharge: personalized,
    });
  }

  if (rows.length === 0) {
    for (const text of order.items) {
      rows.push({ kind: "fallback", text });
    }
  }

  return rows;
}

type RenderParams = {
  order: AdminOrder;
  payment: VerifiedPayPalPayment;
  lines: OrderConfirmationLine[];
};

export function renderOrderConfirmationHtml(params: RenderParams): string {
  const { order, payment, lines } = params;
  const customerName = escapeHtml(order.customerName);
  const orderId = escapeHtml(order.id);
  const orderDate = formatOrderDate(order.createdAt);
  const totalPaid = escapeHtml(formatEuroFromCents(Math.round(order.total * 100)));
  const emailRow = customerEmailUsable(order.email) ? escapeHtml(order.email) : "";

  const shippingBlock =
    !isShippingAddressMissing(payment.shippingAddress) || !isShippingAddressMissing(order.shippingAddress)
      ? (() => {
          const name = escapeHtml(payment.shippingName || order.shippingName || order.customerName);
          const address = escapeHtml(payment.shippingAddress || order.shippingAddress || "");
          return `
        <tr>
          <td style="padding:16px 20px;border-top:1px solid #2a2d35;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#9ca3af;">Livraison</p>
            <p style="margin:0;font-size:14px;line-height:1.5;color:#f3f4f6;">${name}</p>
            <p style="margin:6px 0 0;font-size:14px;line-height:1.5;color:#d1d5db;">${address}</p>
          </td>
        </tr>`;
        })()
      : "";

  const lineRows = lines
    .map((line) => {
      if (line.kind === "fallback") {
        return `
        <tr>
          <td colspan="4" style="padding:12px 0;border-bottom:1px solid #22252d;font-size:14px;color:#e5e7eb;line-height:1.45;">
            ${escapeHtml(line.text)}
          </td>
        </tr>`;
      }
      const perso =
        line.personalization || line.showPersoSurcharge
          ? `<p style="margin:6px 0 0;font-size:12px;color:#fcf6ba;">Ville&nbsp;: ${escapeHtml(line.personalization ?? "—")}${
              line.showPersoSurcharge
                ? ` · Supplément personnalisation&nbsp;: ${escapeHtml(formatEuroFromCents(PERSONALIZATION_SURCHARGE_EUR * 100))}`
                : ""
            }</p>`
          : "";
      return `
        <tr>
          <td style="padding:12px 8px 12px 0;border-bottom:1px solid #22252d;font-size:13px;color:#f3f4f6;vertical-align:top;line-height:1.45;">
            ${escapeHtml(line.description)}
            ${perso}
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid #22252d;font-size:13px;color:#d1d5db;vertical-align:top;text-align:center;">${escapeHtml(line.size)}</td>
          <td style="padding:12px 8px;border-bottom:1px solid #22252d;font-size:13px;color:#d1d5db;vertical-align:top;text-align:center;">${line.qty}</td>
          <td style="padding:12px 0 12px 8px;border-bottom:1px solid #22252d;font-size:13px;color:#f3f4f6;vertical-align:top;text-align:right;white-space:nowrap;">${escapeHtml(line.unitPriceLabel)}</td>
        </tr>`;
    })
    .join("");

  const contact = escapeHtml(DINGRY_ORDERS_INBOX);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Confirmation DINGRY</title>
</head>
<body style="margin:0;padding:0;background:#050505;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0f1116;border:1px solid #2a2d35;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:24px 20px 8px;">
              <p style="margin:0;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#9ca3af;">DINGRY</p>
              <h1 style="margin:12px 0 0;font-size:20px;font-weight:600;color:#ffffff;letter-spacing:0.04em;">Confirmation de commande</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 20px 16px;font-size:14px;line-height:1.55;color:#d1d5db;">
              <p style="margin:0 0 10px;">Bonjour ${customerName},</p>
              <p style="margin:0;">Nous avons bien reçu votre paiement. Voici le récapitulatif de votre commande.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 20px 12px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#e5e7eb;">
                <tr><td style="padding:4px 0;color:#9ca3af;width:42%;">Commande</td><td style="padding:4px 0;">${orderId}</td></tr>
                <tr><td style="padding:4px 0;color:#9ca3af;">Date</td><td style="padding:4px 0;">${orderDate}</td></tr>
                <tr><td style="padding:4px 0;color:#9ca3af;">Paiement</td><td style="padding:4px 0;">PayPal</td></tr>
                ${emailRow ? `<tr><td style="padding:4px 0;color:#9ca3af;">E-mail</td><td style="padding:4px 0;">${emailRow}</td></tr>` : ""}
              </table>
            </td>
          </tr>
          ${shippingBlock}
          <tr>
            <td style="padding:16px 20px 8px;">
              <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#9ca3af;">Articles</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr>
                    <th align="left" style="padding:0 8px 8px 0;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#6b7280;font-weight:600;">Description</th>
                    <th style="padding:0 8px 8px;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#6b7280;font-weight:600;">Taille</th>
                    <th style="padding:0 8px 8px;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#6b7280;font-weight:600;">Qté</th>
                    <th align="right" style="padding:0 0 8px 8px;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#6b7280;font-weight:600;">Prix unit.</th>
                  </tr>
                </thead>
                <tbody>
                  ${lineRows}
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 20px 20px;border-top:1px solid #2a2d35;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#9ca3af;">Total payé</td>
                  <td align="right" style="font-size:18px;font-weight:600;color:#fcf6ba;">${totalPaid}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 20px 24px;font-size:13px;line-height:1.55;color:#9ca3af;">
              <p style="margin:0;">Une question&nbsp;? Répondez à cet e-mail ou écrivez-nous à <a href="mailto:${contact}" style="color:#fcf6ba;text-decoration:none;">${contact}</a>.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderOrderConfirmationText(params: RenderParams): string {
  const { order, lines } = params;
  const parts = [
    `Bonjour ${order.customerName},`,
    "",
    "Confirmation de commande DINGRY",
    `Commande : ${order.id}`,
    `Date : ${order.createdAt}`,
    "Paiement : PayPal",
  ];

  if (customerEmailUsable(order.email)) {
    parts.push(`E-mail : ${order.email}`);
  }

  const address = params.order.shippingAddress?.trim() || params.payment.shippingAddress?.trim();
  if (address && !isShippingAddressMissing(address)) {
    parts.push("", "Livraison :", params.order.shippingName || params.payment.shippingName || order.customerName, address);
  }

  parts.push("", "Articles :");
  for (const line of lines) {
    if (line.kind === "fallback") {
      parts.push(`- ${line.text}`);
    } else {
      let row = `- ${line.description} · Taille ${line.size} · Qté ${line.qty} · ${line.unitPriceLabel}`;
      if (line.personalization) row += ` · Ville : ${line.personalization}`;
      parts.push(row);
    }
  }

  parts.push("", `Total payé : ${formatEuroFromCents(Math.round(order.total * 100))}`, "", `Contact : ${DINGRY_ORDERS_INBOX}`);
  return parts.join("\n");
}

function resendFromAddress(): string {
  return process.env.OPS_ALERT_FROM?.trim() || DINGRY_ORDER_FROM;
}

async function claimConfirmationSend(orderId: string): Promise<"claimed" | "duplicate" | "unavailable"> {
  const client = getSharedRedis();
  if (!client) return "claimed";
  try {
    const locked = await client.set(confirmationSentRedisKey(orderId), "1", {
      nx: true,
      ex: CONFIRMATION_REDIS_TTL_SECONDS,
    });
    return locked === "OK" ? "claimed" : "duplicate";
  } catch (error) {
    console.error("[order-confirmation] dedupe", error instanceof Error ? error.name : "erreur");
    return "unavailable";
  }
}

async function releaseConfirmationClaim(orderId: string): Promise<void> {
  const client = getSharedRedis();
  if (!client) return;
  try {
    await client.del(confirmationSentRedisKey(orderId));
  } catch (error) {
    console.error("[order-confirmation] dedupe rollback", error instanceof Error ? error.name : "erreur");
  }
}

/**
 * Envoi unique (Redis nx avant envoi). Ne doit jamais faire échouer l’appelant.
 */
/**
 * Appelé depuis `persistPayPalPayment` : attend l’envoi avec plafond de temps,
 * sans faire échouer la persistance.
 */
export async function sendCustomerOrderConfirmationForPersist(
  order: AdminOrder,
  payment: VerifiedPayPalPayment,
  quote: CheckoutQuote,
): Promise<void> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      sendCustomerOrderConfirmation(order, payment, quote),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error("customer-order-confirmation-timeout"));
        }, CUSTOMER_ORDER_CONFIRMATION_PERSIST_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    const timedOut =
      error instanceof Error && error.message === "customer-order-confirmation-timeout";
    console.error("[order-confirmation] persist wait", {
      orderId: order.id,
      timedOut,
      issue: error instanceof Error ? error.message : "erreur",
    });
    if (timedOut) {
      await sendOpsAlertOnce(`customer-email-timeout:${order.id}`, "Confirmation client — timeout", {
        orderId: order.id,
        reason: `envoi non terminé après ${CUSTOMER_ORDER_CONFIRMATION_PERSIST_TIMEOUT_MS}ms`,
      });
    }
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

export async function sendCustomerOrderConfirmation(
  order: AdminOrder,
  payment: VerifiedPayPalPayment,
  quote: CheckoutQuote,
): Promise<void> {
  try {
    if (!customerEmailUsable(order.email)) {
      console.error("[order-confirmation] email client absent", { orderId: order.id });
      await sendOpsAlertOnce(`customer-email-missing:${order.id}`, "Confirmation client impossible", {
        orderId: order.id,
        reason: "e-mail client absent ou placeholder — pas d’envoi confirmation",
      });
      return;
    }

    const claim = await claimConfirmationSend(order.id);
    if (claim === "duplicate") return;

    const from = resendFromAddress();
    if (!from) {
      await releaseConfirmationClaim(order.id);
      return;
    }

    const lines = await buildOrderConfirmationLines(order, quote);
    const params = { order, payment, lines };
    const html = renderOrderConfirmationHtml(params);
    const text = renderOrderConfirmationText(params);
    const subject = `DINGRY — Confirmation de commande ${order.id}`;

    const sent = await sendResendEmail({
      from,
      to: [order.email.trim()],
      replyTo: [DINGRY_ORDERS_INBOX],
      bcc: [DINGRY_ORDERS_INBOX],
      subject,
      html,
      text,
    });

    if (sent) return;

    await releaseConfirmationClaim(order.id);
    console.error("[order-confirmation] Resend refusé", { orderId: order.id });
    await sendOpsAlertOnce(`customer-email-failed:${order.id}`, "Confirmation client — échec envoi", {
      orderId: order.id,
      reason: "Resend a refusé la confirmation client",
    });
  } catch (error) {
    await releaseConfirmationClaim(order.id);
    console.error("[order-confirmation]", error instanceof Error ? error.message : "erreur", { orderId: order.id });
    await sendOpsAlertOnce(`customer-email-error:${order.id}`, "Confirmation client — erreur", {
      orderId: order.id,
      reason: error instanceof Error ? error.message : "erreur inconnue",
    });
  }
}
