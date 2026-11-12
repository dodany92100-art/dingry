/**
 * Alerte ops minimale (Resend) — id commande + motif, sans données client.
 */
import { DINGRY_ORDER_FROM, DINGRY_ORDERS_INBOX } from "@/lib/dingry-orders-email";
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

export type ResendEmailPayload = {
  from: string;
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string[];
  bcc?: string[];
};

/** Envoi Resend brut — utilisé par les alertes ops et les confirmations client. */
export async function sendResendEmail(payload: ResendEmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  if (!apiKey || !payload.from || payload.to.length === 0) {
    if (isProductionDeploy()) {
      console.error("[resend] RESEND_API_KEY ou expéditeur/destinataire manquant");
    }
    return false;
  }

  const body: Record<string, unknown> = {
    from: payload.from,
    to: payload.to,
    subject: payload.subject,
  };
  if (payload.html) body.html = payload.html;
  if (payload.text) body.text = payload.text;
  if (payload.replyTo && payload.replyTo.length > 0) body.reply_to = payload.replyTo;
  if (payload.bcc && payload.bcc.length > 0) body.bcc = payload.bcc;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(OPS_ALERT_FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      console.error("[resend] API", response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[resend] envoi", error instanceof Error ? error.name : "erreur");
    return false;
  }
}

function resendFromAddress(): string {
  return process.env.OPS_ALERT_FROM?.trim() || DINGRY_ORDER_FROM;
}

/** @returns true si Resend a accepté l’e-mail (ou config absente en dev). */
export async function sendOpsAlert(subject: string, details: { orderId?: string; reason: string }): Promise<boolean> {
  const to = process.env.OPS_ALERT_EMAIL?.trim() || DINGRY_ORDERS_INBOX;
  const from = resendFromAddress();

  console.error("[ops-alert]", { subject, orderId: details.orderId, reason: details.reason });

  if (!to || !from) {
    if (isProductionDeploy()) {
      console.error("[ops-alert] OPS_ALERT_EMAIL ou OPS_ALERT_FROM manquant — alerte non envoyée");
    }
    return false;
  }

  const text = [`Motif: ${details.reason}`, `Commande PayPal: ${details.orderId ?? "—"}`, `Site: DINGRY`].join("\n");

  return sendResendEmail({
    from,
    to: [to],
    subject: `[DINGRY] ${subject}`,
    text,
  });
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
