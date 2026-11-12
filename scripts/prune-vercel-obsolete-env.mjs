/**
 * Supprime sur Vercel les variables hors stack DINGRY actuelle (Upstash + R2 + Supabase).
 * npm run vercel:env-prune
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Absentes du code / remplacées — sûr à retirer. */
const OBSOLETE_KEYS = [
  "KV_REST_API_URL",
  "KV_URL",
  "KV_REST_API_TOKEN",
  "KV_REST_API_READ_ONLY_TOKEN",
  "REDIS_URL",
  "STRIPE_SECRET_KEY",
];

const TARGETS = ["production", "preview", "development"];

function run(args) {
  const r = spawnSync("vercel", args, { cwd: root, encoding: "utf8", stdio: "pipe" });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim();
  return { ok: r.status === 0, out };
}

for (const key of OBSOLETE_KEYS) {
  for (const env of TARGETS) {
    const { ok, out } = run(["env", "rm", key, env, "-y", "--yes"]);
    if (ok) console.log(`removed ${key} (${env})`);
    else if (/not found|does not exist|ENOENT/i.test(out)) console.log(`skip ${key} (${env})`);
    else console.warn(`warn ${key} (${env}): ${out.split("\n")[0] ?? "erreur"}`);
  }
}

console.log("Purge variables obsolètes terminée.");
