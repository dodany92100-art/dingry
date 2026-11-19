#!/usr/bin/env node
/**
 * Rappel post-code : actions manuelles Supabase / Vercel (sans secrets).
 * Usage : npm run check:supabase-deploy
 */

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const migration = "supabase/migrations/20251119120000_crm_rls_hardening.sql";
const verifySql = "scripts/supabase-verify-rls.sql";

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

console.log("\n📋 DINGRY — à faire côté Supabase / Vercel (hors repo)\n");
console.log("1. Supabase SQL Editor (ou CLI) : appliquer");
console.log(`   → ${migration}`);
if (exists(migration)) console.log("   (fichier présent dans le repo)");
else console.log("   ⚠ fichier introuvable — pull le repo à jour");

console.log("\n2. Exécuter le contrôle RLS :");
console.log(`   → ${verifySql}`);
console.log("   Attendu : aucune policy sur products / product_options / catalog_removed_ids");

console.log("\n3. Vercel → Production :");
console.log("   → DINGRY_FULFILLMENT_OWNER_EMAIL (e-mail compte fulfillment)");
console.log("   → ne pas définir NEXT_PUBLIC_DINGRY_TURNSTILE_PRODUCT_TEST=1");

console.log("\n4. Local (optionnel) : npm run check:prod-env\n");