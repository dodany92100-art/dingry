/**
 * Prépare Redis pour Playwright E2E (GitHub Actions).
 * Base dédiée + préfixe `e2e:` (jamais prod `dingry:`).
 *
 * Secrets repo : UPSTASH_E2E_REDIS_REST_URL, UPSTASH_E2E_REDIS_REST_TOKEN
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";

const root = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.join(root, "..");
loadDotenv({ path: path.join(projectDir, ".env") });
loadDotenv({ path: path.join(projectDir, ".env.local"), override: true });

const MIN_E2E_STOCK = 5;

async function main(): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim() ?? "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ?? "";
  if (!url || !token) {
    console.error(
      "E2E Redis : UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN absents. " +
        "Configurer les secrets GitHub UPSTASH_E2E_REDIS_REST_* (base Upstash dédiée).",
    );
    process.exit(1);
  }

  if (!process.env.STOCK_KEY_PREFIX?.trim()) {
    process.env.STOCK_KEY_PREFIX = "e2e:";
  }

  const prefix = process.env.STOCK_KEY_PREFIX.trim();
  if (prefix === "dingry:" || prefix === "dingry") {
    console.error("E2E Redis : refus de seed sur préfixe prod dingry:.");
    process.exit(1);
  }

  const { loadStoreReadOnly } = await import("../lib/admin/store");
  const { getSharedRedis } = await import("../lib/ratelimit");
  const { writeStockQuantity, stockKeyPrefix } = await import("../lib/stock");

  const client = getSharedRedis();
  if (!client) {
    console.error("E2E Redis : client Upstash indisponible (URL/token invalides).");
    process.exit(1);
  }

  const store = await loadStoreReadOnly();
  let written = 0;
  for (const product of store.products) {
    const id = Number(product.id);
    if (!Number.isInteger(id) || id <= 0) continue;
    const qty = Math.max(Number(product.stock) || 0, MIN_E2E_STOCK);
    const ok = await writeStockQuantity(id, qty);
    if (ok) written += 1;
  }

  console.log(
    `E2E Redis : ${written} produit(s) stockés (préfixe ${stockKeyPrefix()}, min ${MIN_E2E_STOCK}).`,
  );
  if (written === 0) {
    console.error("E2E Redis : aucun produit seed — catalogue vide ?");
    process.exit(1);
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});