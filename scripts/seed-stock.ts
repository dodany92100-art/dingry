/**
 * Seed Redis stock depuis le catalogue Blob (quantités admin → clés dingry:stock:*).
 *
 * Local (mêmes vars que l’env cible) :
 *   npm run seed-stock
 *
 * Preview Vercel — tirer les secrets puis seed la base Preview :
 *   vercel link
 *   vercel env pull .env.preview --environment=preview
 *   set -a && source .env.preview && set +a && npm run seed-stock
 *   (ne pas committer .env.preview)
 *
 * Requis : UPSTASH_REDIS_REST_*, BLOB_READ_WRITE_TOKEN, pas de STOCK_KEY_PREFIX=test:
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import { loadStoreReadOnly } from "../lib/admin/store";

const root = path.dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: path.join(root, "..", ".env") });
loadDotenv({ path: path.join(root, "..", ".env.local"), override: true });
loadDotenv({ path: path.join(root, "..", ".env.preview"), override: true });
import { seedCatalogStockFromProducts } from "../lib/stock";

async function main() {
  const store = await loadStoreReadOnly();
  await seedCatalogStockFromProducts(store.products);
  console.log(`Stock initialisé pour ${store.products.length} produits.`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.name : error);
  process.exit(1);
});
