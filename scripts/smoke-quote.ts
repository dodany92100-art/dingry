/**
 * Smoke post-seed (B4) : catalogue HTTP + quote checkout (stock Redis initialisé).
 *
 *   vercel env pull .env.preview --environment=preview
 *   npm run seed-stock
 *   SMOKE_BASE_URL=https://votre-preview.vercel.app npm run smoke:quote
 *
 * Local (dev sur :3000) :
 *   npm run dev
 *   npm run smoke:quote
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";

const root = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.join(root, "..");
loadDotenv({ path: path.join(projectDir, ".env") });
loadDotenv({ path: path.join(projectDir, ".env.local"), override: true });
loadDotenv({ path: path.join(projectDir, ".env.preview"), override: true });

type CatalogProduct = {
  id: number;
  inStock?: boolean;
  sizes?: string[];
};

function resolveBaseUrl(): string {
  const explicit = process.env.SMOKE_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return "http://localhost:3000";
}

function pickQuoteLine(
  products: CatalogProduct[],
  forcedId: number | null,
): { productId: number; size: string } | null {
  const candidates = forcedId
    ? products.filter((p) => p.id === forcedId)
    : products.filter((p) => p.inStock === true);

  for (const product of candidates) {
    const sizes = Array.isArray(product.sizes) ? product.sizes : [];
    const size = sizes.find((s) => typeof s === "string" && s.trim().length > 0);
    if (size) return { productId: product.id, size: size.trim() };
  }
  return null;
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { _raw: text.slice(0, 200) };
  }
}

async function main(): Promise<void> {
  const base = resolveBaseUrl();
  const forcedArg = process.argv.find((a) => a.startsWith("--product-id="));
  const forcedId = forcedArg ? Number(forcedArg.split("=")[1]) : null;
  if (forcedArg && (!Number.isInteger(forcedId) || forcedId! <= 0)) {
    console.error("Option --product-id= doit être un entier positif.");
    process.exit(1);
  }

  console.log(`Smoke B4 · base ${base}`);

  const catalogRes = await fetch(`${base}/api/catalog`, { headers: { Accept: "application/json" } });
  const catalogBody = await readJson(catalogRes);
  if (!catalogRes.ok) {
    console.error(`✗ GET /api/catalog → ${catalogRes.status}`, catalogBody);
    process.exit(1);
  }

  const products = (catalogBody as { products?: CatalogProduct[] }).products;
  if (!Array.isArray(products) || products.length === 0) {
    console.error("✗ Catalogue vide ou réponse invalide.");
    process.exit(1);
  }

  const inStockCount = products.filter((p) => p.inStock === true).length;
  const missingStockHint =
    inStockCount === 0
      ? " Aucun produit inStock — exécuter npm run seed-stock sur la même base Redis que cette URL."
      : "";
  console.log(`✓ GET /api/catalog → ${products.length} produits (${inStockCount} inStock).${missingStockHint}`);

  const line = pickQuoteLine(products, forcedId);
  if (!line) {
    console.error(
      forcedId
        ? `✗ Produit ${forcedId} introuvable ou sans taille utilisable pour quote.`
        : "✗ Aucun produit inStock avec taille — seed-stock requis ou choisir --product-id=.",
    );
    process.exit(1);
  }

  const quoteRes = await fetch(`${base}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      intent: "quote",
      lines: [{ productId: line.productId, size: line.size, qty: 1 }],
    }),
  });
  const quoteBody = await readJson(quoteRes);

  if (quoteRes.status === 503) {
    console.error(
      `✗ POST quote (id ${line.productId}, ${line.size}) → 503 — clés dingry:stock:* absentes ou Redis down.`,
      quoteBody,
    );
    console.error("→ npm run seed-stock sur l’env cible, puis relancer smoke:quote.");
    process.exit(1);
  }

  if (!quoteRes.ok) {
    console.error(`✗ POST quote → ${quoteRes.status}`, quoteBody);
    process.exit(1);
  }

  const totalCents = (quoteBody as { totalCents?: unknown }).totalCents;
  if (typeof totalCents !== "number" || totalCents <= 0) {
    console.error("✗ Réponse quote sans totalCents valide.", quoteBody);
    process.exit(1);
  }

  console.log(
    `✓ POST quote → ${totalCents} centimes (${(totalCents / 100).toFixed(2)} EUR) · produit ${line.productId} · ${line.size}`,
  );
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
