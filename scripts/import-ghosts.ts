/**
 * Importe des fantômes boutique (PRODUCTS sans fiche CRM) vers Supabase, live + stock Redis.
 * Usage : npx tsx scripts/import-ghosts.ts
 *         npx tsx scripts/import-ghosts.ts --apply --ids=2,4,6,7
 *         npx tsx scripts/import-ghosts.ts --apply --ids=… --force  (si DIFFÉRENT ⚠)
 *
 * Les ids verso sont refusés : importez le recto (le dos est rempli via imageBackUrl).
 */
import { config } from "dotenv";
import path from "node:path";
import { resolveImportableShopProduct, shopProductToImportAdminProduct } from "../lib/admin/import-ghost-from-shop";
import { isVersoCatalogId, resolveRectoCatalogId } from "../lib/catalog-verso-recto";
import { seedCatalogStockFromProducts } from "../lib/stock";

config({ path: path.join(process.cwd(), ".env") });
config({ path: path.join(process.cwd(), ".env.local"), override: true });

async function main(): Promise<void> {
  const { PRODUCTS } = await import("../lib/shop-data");
  const { listSupabaseProducts, upsertSupabaseProduct } = await import("../lib/supabase/admin-products");

  const crm = await listSupabaseProducts();
  const crmIds = new Set(crm.map((p) => p.id));

  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const force = args.includes("--force");
  const idsArg = args.find((a) => a.startsWith("--ids="));

  function importMatchesShopDisplay(
    shop: import("../lib/catalog").ShopProduct,
    row: ReturnType<typeof shopProductToImportAdminProduct>,
  ): boolean {
    return (
      row.name === shop.name &&
      row.variant === shop.variant &&
      row.price === shop.price &&
      row.imageUrl === shop.image.trim()
    );
  }

  let targetIds: number[];
  if (idsArg) {
    targetIds = idsArg
      .slice("--ids=".length)
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);
  } else {
    const { listRemovedCatalogIds } = await import("../lib/supabase/admin-products");
    const removed = new Set((await listRemovedCatalogIds()).map(Number));
    targetIds = PRODUCTS.filter(
      (p) => !isVersoCatalogId(p.id) && !crmIds.has(String(p.id)) && !removed.has(p.id),
    ).map((p) => p.id);
    console.log("(Sans --ids : liste = tous les fantômes recto du dry-run.)");
  }

  if (targetIds.length === 0) {
    console.log("Aucun id à traiter.");
    return;
  }

  const plan: {
    id: number;
    sku: string;
    shop: import("../lib/catalog").ShopProduct;
    admin: ReturnType<typeof shopProductToImportAdminProduct>;
    identical: boolean;
  }[] = [];
  const errors: string[] = [];

  for (const id of targetIds) {
    if (isVersoCatalogId(id)) {
      errors.push(`#${id} : id verso — importez le recto #${resolveRectoCatalogId(id)}.`);
      continue;
    }
    if (crmIds.has(String(id))) {
      errors.push(`#${id} : fiche CRM déjà présente — ignoré.`);
      continue;
    }
    const shop = resolveImportableShopProduct(id);
    if (!shop) {
      errors.push(`#${id} : absent de PRODUCTS — ignoré.`);
      continue;
    }
    const admin = shopProductToImportAdminProduct(shop);
    plan.push({
      id,
      sku: admin.sku,
      shop,
      admin,
      identical: importMatchesShopDisplay(shop, admin),
    });
  }

  const mismatched = plan.filter((row) => !row.identical);

  console.log(`Import planifié : ${plan.length} fiche(s)`);
  for (const row of plan) {
    const { admin, shop } = row;
    const back = admin.imageBackUrl.trim().length > 0;
    console.log(
      `  #${row.id}  ${row.sku}  ${admin.name} — ${admin.variant}  · ${admin.price} €  · stock ${admin.stock}` +
        `  · ${back ? "dos CRM" : "sans dos"}  · rendu boutique ${row.identical ? "IDENTIQUE" : "DIFFÉRENT ⚠"}`,
    );
    if (!row.identical) {
      console.log(
        `      boutique : ${shop.name} — ${shop.variant} · ${shop.price} € · image ${shop.image.slice(0, 48)}…`,
      );
    }
  }
  if (errors.length > 0) {
    console.log("\nIgnorés / erreurs :");
    for (const line of errors) console.log(`  ${line}`);
  }

  if (!apply) {
    console.log("\nDry-run : rien en base. Relancer avec --apply --ids=…");
    return;
  }

  if (plan.length === 0) {
    console.log("\nRien à importer.");
    return;
  }

  if (mismatched.length > 0 && !force) {
    console.error(
      `\nRefus --apply : ${mismatched.length} fiche(s) DIFFÉRENT du rendu boutique (ids: ${mismatched.map((r) => r.id).join(", ")}).`,
    );
    console.error("Corrigez le mapping ou relancez avec --force si vous assumez l'écart.");
    process.exit(1);
  }

  const imported: { id: string; stock: number }[] = [];
  for (const row of plan) {
    await upsertSupabaseProduct(row.admin);
    imported.push({ id: row.admin.id, stock: row.admin.stock });
    console.log(`✓ importé #${row.admin.id}`);
  }

  await seedCatalogStockFromProducts(imported);
  console.log(`Stock Redis : seedCatalogStockIfMissing pour ${imported.length} id(s).`);
  console.log("Revalider le catalogue (admin mutation) ou redéployer (cache v2).");
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
