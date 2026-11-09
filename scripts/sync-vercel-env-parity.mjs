/**
 * Aligne Preview + Production sur Vercel (mêmes clés CRM, images, paiement).
 * npm run vercel:env-sync
 * Sources : .env.local puis valeurs déjà présentes en Production.
 */
import { config as loadDotenv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { VERCEL_ENV_TARGETS, VERCEL_SHARED_ENV_KEYS } from "../lib/vercel-shared-env-keys.mjs";
import { createVercelApi, loadProjectAuth } from "./vercel-env-api.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
loadDotenv({ path: path.join(root, ".env") });
loadDotenv({ path: path.join(root, ".env.local"), override: true });

/** Fallback local uniquement pour l’hôte CDN (dev sans .env.local). Jamais PAYPAL_ENV ici. */
const LOCAL_DEFAULTS = {
  DINGRY_IMG_HOSTS: "pub-8ef850fa01fb9fda829a4ffa6455c86b.r2.dev",
};

function localValue(key) {
  const fromEnv = process.env[key]?.trim() ?? "";
  if (fromEnv) return fromEnv;
  if (key in LOCAL_DEFAULTS) return LOCAL_DEFAULTS[key];
  return "";
}

const auth = loadProjectAuth();
const { listEnvs, upsertEnv, envForTarget } = createVercelApi(auth);

const prodDecrypted = await listEnvs(true);

for (const { key, plain } of VERCEL_SHARED_ENV_KEYS) {
  let value = localValue(key);
  if (!value) {
    const prod = envForTarget(prodDecrypted, key, "production");
    value = typeof prod?.value === "string" ? prod.value.trim() : "";
  }
  await upsertEnv(key, value, { plain: Boolean(plain), targets: VERCEL_ENV_TARGETS });
}

const envs = await listEnvs();
const needCron = (target) => !envForTarget(envs, "CRON_SECRET", target);
if (needCron("preview") || needCron("production")) {
  const cron = randomBytes(32).toString("base64url");
  for (const target of VERCEL_ENV_TARGETS) {
    if (needCron(target)) await upsertEnv("CRON_SECRET", cron, { plain: false, targets: [target] });
  }
}

console.log("Preview + Production alignés (voir verify:vercel-env pour contrôle).");
