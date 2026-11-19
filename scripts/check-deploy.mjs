#!/usr/bin/env node
/**
 * Contrôles pré-déploiement (code + rappel Supabase manuel).
 * Usage : npm run check:deploy
 */

import { execSync } from "node:child_process";

function run(label, cmd) {
  console.log(`\n── ${label}\n`);
  try {
    execSync(cmd, { stdio: "inherit", cwd: process.cwd() });
  } catch {
    process.exitCode = 1;
  }
}

run("Anti-régression", "node scripts/verify-anti-regression.js");
run("Variables production (local .env)", "npm run check:prod-env");
run("Rappel Supabase / Vercel", "npm run check:supabase-deploy");

if (process.exitCode === 1) {
  console.error("\nÉchec check:deploy — corriger avant push prod.\n");
} else {
  console.log("\nCheck deploy OK (hors migration SQL Supabase à appliquer à la main).\n");
}