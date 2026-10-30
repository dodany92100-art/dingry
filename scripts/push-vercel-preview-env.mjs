/**
 * Pousse les variables boutique vers Vercel Preview (toutes branches) via l’API Vercel.
 * Lance : npm run vercel:env-preview
 * (wrapper vercel env run --environment production)
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { config as loadDotenv } from "dotenv";

const root = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.join(root, "..");
loadDotenv({ path: path.join(projectDir, ".env") });
loadDotenv({ path: path.join(projectDir, ".env.local"), override: true });

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

const KEYS = [
  "ADMIN_TOTP_SECRET",
  "BLOB_READ_WRITE_TOKEN",
  "NEXT_PUBLIC_PAYPAL_CLIENT_ID",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "PAYPAL_CLIENT_SECRET",
  "TURNSTILE_SECRET_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "PAYPAL_ENV",
];

function envValue(name) {
  if (name === "PAYPAL_ENV") return "sandbox";
  return process.env[name]?.trim() ?? "";
}

async function api(pathname, init = {}) {
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

async function listEnvs(decrypt = false) {
  const q = decrypt ? "?decrypt=true" : "";
  const data = await api(`/v9/projects/${projectId}/env${q}`);
  return data.envs ?? [];
}

function productionValue(envs, key) {
  const row = envs.find((e) => e.key === key && e.target?.includes("production"));
  return typeof row?.value === "string" ? row.value.trim() : "";
}

async function upsertPreview(key, value) {
  if (!value) {
    console.log(`skip ${key} (vide)`);
    return;
  }
  const envs = await listEnvs();
  const existing = envs.find(
    (e) => e.key === key && e.target?.includes("preview") && !e.gitBranch,
  );
  const payload = {
    key,
    value,
    type: key.startsWith("NEXT_PUBLIC_") ? "plain" : "encrypted",
    target: ["preview"],
  };
  if (existing?.id) {
    await api(`/v9/projects/${projectId}/env/${existing.id}`, {
      method: "PATCH",
      body: JSON.stringify({ value, type: payload.type, target: payload.target }),
    });
    console.log(`updated ${key} (preview)`);
    return;
  }
  await api(`/v10/projects/${projectId}/env`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  console.log(`added ${key} (preview)`);
}

async function upsertProduction(key, value) {
  const envs = await listEnvs();
  if (envs.some((e) => e.key === key && e.target?.includes("production"))) {
    console.log(`${key} déjà en production`);
    return;
  }
  await api(`/v10/projects/${projectId}/env`, {
    method: "POST",
    body: JSON.stringify({
      key,
      value,
      type: "encrypted",
      target: ["production"],
    }),
  });
  console.log(`added ${key} (production)`);
}

const prodDecrypted = await listEnvs(true);

for (const key of KEYS) {
  let value = envValue(key);
  if (!value && key !== "PAYPAL_ENV") {
    value = productionValue(prodDecrypted, key);
  }
  await upsertPreview(key, value);
}

const cronListed = await listEnvs();
if (!cronListed.some((e) => e.key === "CRON_SECRET" && e.target?.includes("preview"))) {
  const cron = randomBytes(32).toString("base64url");
  await upsertPreview("CRON_SECRET", cron);
  await upsertProduction("CRON_SECRET", cron);
} else {
  console.log("CRON_SECRET déjà sur preview");
}

console.log("Preview env OK (API).");
