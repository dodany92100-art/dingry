import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { adminProductToRow } from "../lib/supabase/product-row";
import type { AdminProduct } from "../lib/admin/types";
import { normalizePrintPlacement, normalizeProductCategory, normalizePublishStatus } from "../lib/admin/types";

config({ path: path.join(process.cwd(), ".env.local") });
config({ path: path.join(process.cwd(), ".env") });

const LOCAL_STORE = path.join(process.cwd(), "data", "admin", "store.json");

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

function asProduct(raw: Record<string, unknown>, index: number): AdminProduct {
  const id = String(raw.id ?? index + 1);
  return {
    id,
    sku: String(raw.sku ?? `DINGRY-${id}`),
    name: String(raw.name ?? "Produit"),
    variant: String(raw.variant ?? ""),
    description: String(raw.description ?? ""),
    fabrication: String(raw.fabrication ?? ""),
    limitedEdition: String(raw.limitedEdition ?? ""),
    materials: String(raw.materials ?? ""),
    sizeGuide: String(raw.sizeGuide ?? ""),
    printPlacement: normalizePrintPlacement(raw.printPlacement),
    category: normalizeProductCategory(String(raw.category ?? "T-shirts")),
    price: Number(raw.price) || 0,
    sizes: Array.isArray(raw.sizes) ? raw.sizes.map(String) : ["S", "M", "L", "XL"],
    stock: Math.max(0, Math.floor(Number(raw.stock) || 0)),
    publishStatus: normalizePublishStatus(raw.publishStatus),
    colorDeclinations: Array.isArray(raw.colorDeclinations) ? raw.colorDeclinations.map(String) : [],
    imageUrl: String(raw.imageUrl ?? raw.image ?? "/dingry-draft-product.svg"),
    blobUrl: typeof raw.blobUrl === "string" ? raw.blobUrl : null,
    blobPathname: typeof raw.blobPathname === "string" ? raw.blobPathname : null,
    imageBackUrl: String(raw.imageBackUrl ?? ""),
    imageBackBlobUrl: typeof raw.imageBackBlobUrl === "string" ? raw.imageBackBlobUrl : null,
    imageBackBlobPathname: typeof raw.imageBackBlobPathname === "string" ? raw.imageBackBlobPathname : null,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    isPinned: Boolean(raw.isPinned),
    displayOrder: Number(raw.displayOrder) || index,
  };
}

async function loadProducts(): Promise<{ products: AdminProduct[]; removed: string[] }> {
  try {
    const text = await readFile(LOCAL_STORE, "utf8");
    const parsed = JSON.parse(text) as { products?: unknown[]; removedCatalogIds?: unknown[] };
    const products = (parsed.products ?? [])
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
      .map((item, index) => asProduct(item, index));
    const removed = (parsed.removedCatalogIds ?? []).map((id) => String(id));
    return { products, removed };
  } catch {
    console.error("Fichier local introuvable:", LOCAL_STORE);
    throw new Error("Place data/admin/store.json ou lance le CRM en local une fois.");
  }
}

async function main(): Promise<void> {
  const url = env("SUPABASE_URL") || env("NEXT_PUBLIC_SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.");
  }

  const store = await loadProducts();
  const client = createClient(url, key, { auth: { persistSession: false } });

  const probe = await client.from("products").select("id").limit(1);
  if (probe.error) {
    console.error("Table products absente. Exécute supabase/schema.sql dans le SQL Editor Supabase.");
    throw new Error(probe.error.message);
  }

  const rows = store.products.map((product: AdminProduct) => adminProductToRow(product));
  const chunk = 80;
  let upserted = 0;
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    const { error } = await client.from("products").upsert(slice, { onConflict: "id" });
    if (error) throw new Error(error.message);
    upserted += slice.length;
  }

  const removed = store.removed.map((id: string) => ({ id }));
  if (removed.length > 0) {
    const { error } = await client.from("catalog_removed_ids").upsert(removed, { onConflict: "id" });
    if (error) console.warn("catalog_removed_ids:", error.message);
  }

  console.log(`Import OK · ${upserted} produits → Supabase`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
