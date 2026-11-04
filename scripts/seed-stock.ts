/**
 * Seed Redis stock depuis le catalogue Blob (quantités admin → clés dingry:stock:*).
 *
 * Local (mêmes vars que l’env cible) :
 *   npm run seed-stock
 *
 * Preview Vercel — tirer les secrets puis seed la base Preview :
 *   vercel env pull .env.preview --environment=preview
 *   npm run seed-stock
 *   (ne pas committer .env.preview)
 *
 * Requis : UPSTASH_REDIS_REST_*, BLOB_READ_WRITE_TOKEN, pas de STOCK_KEY_PREFIX=test:
 */
import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import type { Redis } from "@upstash/redis";

const root = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.join(root, "..");
loadDotenv({ path: path.join(projectDir, ".env") });
loadDotenv({ path: path.join(projectDir, ".env.local"), override: true });
loadDotenv({ path: path.join(projectDir, ".env.preview"), override: true });
if (process.env.STOCK_KEY_PREFIX?.trim().startsWith("test:")) {
  delete process.env.STOCK_KEY_PREFIX;
}

function redisDisplayHost(): string {
  const raw = process.env.UPSTASH_REDIS_REST_URL?.trim() ?? "";
  try {
    return new URL(raw).hostname;
  } catch {
    return raw || "(URL absente)";
  }
}

async function scanKeys(client: Redis, pattern: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor = 0;
  do {
    const [next, batch] = await client.scan(cursor, { match: pattern, count: 200 });
    cursor = Number(next);
    keys.push(...batch);
  } while (cursor !== 0);
  return keys;
}

async function confirmTarget(pattern: string): Promise<void> {
  const host = redisDisplayHost();
  console.log(`Redis cible : ${host}`);
  console.log(`Clés attendues : ${pattern}`);
  if (!process.stdin.isTTY) {
    console.warn("Entrée non interactive — seed sans confirmation (CI / pipe).");
    return;
  }
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question('Confirmer le seed sur cette base ? Tapez "oui" : ');
  rl.close();
  if (answer.trim().toLowerCase() !== "oui") {
    console.error("Seed annulé.");
    process.exit(1);
  }
}

async function main() {
  const prefix = process.env.STOCK_KEY_PREFIX?.trim() ?? "";
  if (prefix.startsWith("test:")) {
    console.error("Refus : STOCK_KEY_PREFIX=test: — retire-le pour seed prod/preview (dingry:).");
    process.exit(1);
  }

  const { loadStoreReadOnly } = await import("../lib/admin/store");
  const { getSharedRedis } = await import("../lib/ratelimit");
  const { seedCatalogStockFromProducts, stockKeyPrefix } = await import("../lib/stock");

  const client = getSharedRedis();
  if (!client) {
    console.error("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN manquants ou invalides.");
    process.exit(1);
  }

  const pattern = `${stockKeyPrefix()}stock:*`;
  await confirmTarget(pattern);

  const store = await loadStoreReadOnly();
  await seedCatalogStockFromProducts(store.products);

  const keys = await scanKeys(client, pattern);
  console.log(`Stock initialisé pour ${store.products.length} produits (${keys.length} clés ${pattern}).`);
  if (keys.length === 0) {
    console.error("Aucune clé Redis créée — vérifie Upstash et les ids produits du catalogue.");
    process.exit(1);
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.name : error);
  process.exit(1);
});
