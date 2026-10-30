/**
 * Finalise Preview : clés Turnstile de test (Preview), webhook PayPal Sandbox, PAYPAL_WEBHOOK_ID.
 * Usage : node scripts/setup-preview-paypal-webhook.mjs [baseUrl]
 * Default baseUrl : https://dingry-git-master-days-projects-36e5dc27.vercel.app
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";

const root = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.join(root, "..");
loadDotenv({ path: path.join(projectDir, ".env.preview"), override: true });
loadDotenv({ path: path.join(projectDir, ".env.local"), override: true });
loadDotenv({ path: path.join(projectDir, ".env"), override: true });

const projectId = JSON.parse(
  readFileSync(path.join(projectDir, ".vercel", "project.json"), "utf8"),
).projectId;
const teamId = JSON.parse(
  readFileSync(path.join(projectDir, ".vercel", "project.json"), "utf8"),
).orgId;
const auth = JSON.parse(
  readFileSync(
    path.join(process.env.HOME ?? "", "Library/Application Support/com.vercel.cli/auth.json"),
    "utf8",
  ),
);

/** Cloudflare — always pass (tests / Preview sandbox). */
const TURNSTILE_TEST_SITE = "1x00000000000000000000AA";
const TURNSTILE_TEST_SECRET = "1x0000000000000000000000000000000AA";

const previewBase =
  process.argv[2]?.replace(/\/$/, "") ||
  "https://dingry-git-master-days-projects-36e5dc27.vercel.app";
const webhookUrl = `${previewBase}/api/paypal/webhook`;

async function vercelApi(pathname, init = {}) {
  const url = new URL(pathname, "https://api.vercel.com");
  url.searchParams.set("teamId", teamId);
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = typeof body.error?.message === "string" ? body.error.message : response.statusText;
    throw new Error(`${init.method ?? "GET"} ${pathname}: ${msg}`);
  }
  return body;
}

async function listEnvs() {
  const data = await vercelApi(`/v9/projects/${projectId}/env`);
  return data.envs ?? [];
}

async function upsertPreview(key, value, type) {
  const envs = await listEnvs();
  const existing = envs.find(
    (e) => e.key === key && e.target?.includes("preview") && !e.gitBranch,
  );
  const target = ["preview"];
  if (existing?.id) {
    await vercelApi(`/v9/projects/${projectId}/env/${existing.id}`, {
      method: "PATCH",
      body: JSON.stringify({ value, type, target }),
    });
    console.log(`updated ${key} (preview)`);
    return;
  }
  await vercelApi(`/v10/projects/${projectId}/env`, {
    method: "POST",
    body: JSON.stringify({ key, value, type, target }),
  });
  console.log(`added ${key} (preview)`);
}

async function paypalToken() {
  const clientId =
    process.env.PAYPAL_CLIENT_ID?.trim() || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() || "";
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim() || "";
  if (!clientId || !secret) throw new Error("PayPal credentials manquantes (.env.preview)");
  const base =
    process.env.PAYPAL_ENV?.trim().toLowerCase() === "sandbox"
      ? "https://api-m.sandbox.paypal.com"
      : "https://api-m.paypal.com";
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) throw new Error(`PayPal OAuth ${response.status}`);
  const data = await response.json();
  if (!data.access_token) throw new Error("PayPal OAuth sans token");
  return { token: data.access_token, base };
}

async function ensurePayPalWebhook(token, base) {
  const list = await fetch(`${base}/v1/notifications/webhooks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!list.ok) throw new Error(`PayPal list webhooks ${list.status}`);
  const data = await list.json();
  const hooks = data.webhooks ?? [];
  const existing = hooks.find((h) => h.url === webhookUrl);
  if (existing?.id) {
    console.log(`webhook PayPal existant ${existing.id}`);
    return existing.id;
  }
  const create = await fetch(`${base}/v1/notifications/webhooks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: webhookUrl,
      event_types: [
        { name: "PAYMENT.CAPTURE.COMPLETED" },
        { name: "PAYMENT.CAPTURE.REFUNDED" },
        { name: "PAYMENT.CAPTURE.REVERSED" },
      ],
    }),
  });
  if (!create.ok) {
    const err = await create.text();
    throw new Error(`PayPal create webhook ${create.status}: ${err.slice(0, 200)}`);
  }
  const created = await create.json();
  console.log(`webhook PayPal créé ${created.id}`);
  return created.id;
}

await upsertPreview("NEXT_PUBLIC_TURNSTILE_SITE_KEY", TURNSTILE_TEST_SITE, "plain");
await upsertPreview("TURNSTILE_SECRET_KEY", TURNSTILE_TEST_SECRET, "encrypted");

const { token, base } = await paypalToken();
const webhookId = await ensurePayPalWebhook(token, base);
await upsertPreview("PAYPAL_WEBHOOK_ID", webhookId, "encrypted");

console.log(`Preview prête : ${previewBase}`);
console.log(`Webhook : ${webhookUrl}`);
