/**
 * Liste les clés présentes sur Preview mais absentes de Production (et l’inverse).
 * npm run verify:vercel-env
 */
import { VERCEL_SHARED_ENV_KEYS } from "../lib/vercel-shared-env-keys.mjs";
import { createVercelApi, loadProjectAuth } from "./vercel-env-api.mjs";

const KEYS = VERCEL_SHARED_ENV_KEYS.map((row) => row.key);
const auth = loadProjectAuth();
const { listEnvs, envForTarget } = createVercelApi(auth);
const envs = await listEnvs();

function missing(target, other) {
  return KEYS.filter((key) => {
    const has = Boolean(envForTarget(envs, key, target));
    const otherHas = Boolean(envForTarget(envs, key, other));
    return otherHas && !has;
  });
}

const prodMissing = missing("production", "preview");
const previewMissing = missing("preview", "production");

for (const key of KEYS) {
  const p = envForTarget(envs, key, "preview") ? "✓" : "—";
  const r = envForTarget(envs, key, "production") ? "✓" : "—";
  console.log(`${p} preview | ${r} prod | ${key}`);
}

if (prodMissing.length > 0) {
  console.error(`\nManquant en Production : ${prodMissing.join(", ")}`);
}
if (previewMissing.length > 0) {
  console.error(`\nManquant en Preview : ${previewMissing.join(", ")}`);
}

if (prodMissing.length > 0 || previewMissing.length > 0) {
  console.error("\n→ npm run vercel:env-sync (après .env.local) puis redeploy Production.");
  process.exit(1);
}
console.log("\nParité Preview / Production OK (présence des clés).");
