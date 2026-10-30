/**
 * Alerte ops minimale (Resend) — id commande + motif, sans données client.
 */
export async function sendOpsAlert(subject: string, details: { orderId?: string; reason: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const to = process.env.OPS_ALERT_EMAIL?.trim() ?? "";
  const from = process.env.OPS_ALERT_FROM?.trim() ?? "";

  console.error("[ops-alert]", { subject, orderId: details.orderId, reason: details.reason });

  if (!apiKey || !to || !from) {
    return;
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
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error("[ops-alert] Resend", response.status);
    }
  } catch (error) {
    console.error("[ops-alert] envoi", error instanceof Error ? error.name : "erreur");
  }
}
