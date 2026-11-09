/**
 * Liste les produits visibles sur le site (PRODUCTS) sans fiche CRM et sans tombstone.
 * Usage : npx tsx scripts/list-ghost-products.ts
 *         npx tsx scripts/list-ghost-products.ts --apply --ids=1,3,5
 */
import { config } from "dotenv";
import path from "node:path";

config({ path: path.join(process.cwd(), ".env") });
config({ path: path.join(process.cwd(), ".env.local"), override: true });

async function main(): Promise<void> {
  const { PRODUCTS } = await import("../lib/shop-data");
  const { isVersoCatalogId } = await import("../lib/catalog-verso-recto");
  const { listSupabaseProducts, listRemovedCatalogIds, addRemovedCatalogIds } = await import(
    "../lib/supabase/admin-products"
  );

  const crm = await listSupabaseProducts();
  const crmIds = new Set(crm.map((p) => Number(p.id)));
  const removed = new Set((await listRemovedCatalogIds()).map(Number));

  const ghosts = PRODUCTS.filter(
    (p) => !isVersoCatalogId(p.id) && !crmIds.has(p.id) && !removed.has(p.id),
  );

  console.log(`CRM : ${crm.length} fiches · tombstones : ${removed.size}`);
  console.log(`Fantômes visibles sur le site sans fiche CRM : ${ghosts.length}`);
  for (const p of ghosts) {
    console.log(`  #${p.id}  ${p.name} — ${p.variant}  (${p.category})`);
  }

  const args = process.argv.slice(2);
  if (!args.includes("--apply")) {
    console.log("\nDry-run : rien modifié. Relancer avec --apply --ids=1,3,5 pour masquer.");
    return;
  }

  const idsArg = args.find((a) => a.startsWith("--ids="));
  if (!idsArg) {
    console.error("--apply exige --ids=… (liste explicite, pas de masquage en bloc).");
    process.exit(1);
  }
  const ids = idsArg
    .slice("--ids=".length)
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);

  const allowed = new Set(ghosts.map((g) => g.id));
  const unknown = ids.filter((id) => !allowed.has(id));
  if (unknown.length > 0) {
    console.error(`Ids refusés (pas des fantômes) : ${unknown.join(", ")}`);
    process.exit(1);
  }

  await addRemovedCatalogIds(ids.map(String));
  console.log(`Tombstones ajoutés : ${ids.join(", ")}`);
  console.log("Puis : redéployer (clé de cache v2) ou revalider le catalogue depuis l'admin.");
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
