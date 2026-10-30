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
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";

const root = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.join(root, "..");
loadDotenv({ path: path.join(projectDir, ".env") });
loadDotenv({ path: path.join(projectDir, ".env.local"), override: true });
loadDotenv({ path: path.join(projectDir, ".env.preview"), override: true });
if (process.env.STOCK_KEY_PREFIX?.trim().startsWith("test:")) {
  delete process.env.STOCK_KEY_PREFIX;
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

  const store = await loadStoreReadOnly();
  await seedCatalogStockFromProducts(store.products);

  const pattern = `${stockKeyPrefix()}stock:*`;
  const keys = await client.keys(pattern);
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
