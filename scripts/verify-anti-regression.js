#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const root = process.cwd();
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';
const YELLOW = '\x1b[33m';
const CODE_EXT = /\.(tsx?|jsx?)$/;
const ATOMIC_DIRS = ['atoms', 'molecules', 'organisms', 'templates', 'pages'];
const EXPECTED_SIZES = ['S', 'M', 'L', 'XL', 'TU'];

let errorsCount = 0;

function logError(msg) {
  console.error(`${RED}✖ [FAIL] ${msg}${RESET}`);
  errorsCount++;
}

function logSuccess(msg) {
  console.log(`${GREEN}✔ [PASS] ${msg}${RESET}`);
}

function collectFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, ent.name);
    if (ent.isDirectory()) collectFiles(filePath, out);
    else if (CODE_EXT.test(ent.name)) out.push(filePath);
  }
  return out;
}

console.log(`\n${YELLOW}🔍 Contrôle anti-régression DINGRY (invariants métier)…${RESET}\n`);

const componentsDir = path.join(root, 'components');
const libDir = path.join(root, 'lib');
const componentsFiles = collectFiles(componentsDir);
const libFiles = collectFiles(libDir);

// 1. Fallback fictif ?? 119
let found119 = false;
for (const file of [...componentsFiles, ...libFiles]) {
  const content = fs.readFileSync(file, 'utf8');
  if (/\?\?\s*119/.test(content)) {
    logError(`Fallback '?? 119' dans : ${path.relative(root, file)}`);
    found119 = true;
  }
}
if (!found119) logSuccess("Aucun fallback '?? 119' résiduel.");

// 2. console.log dans components/
let foundConsole = false;
for (const file of componentsFiles) {
  if (/console\.log\(/.test(fs.readFileSync(file, 'utf8'))) {
    logError(`console.log dans : ${path.relative(root, file)}`);
    foundConsole = true;
  }
}
if (!foundConsole) logSuccess('Aucun console.log dans components/.');

// 3. SIZES (shop-data)
const shopDataPath = path.join(libDir, 'shop-data.ts');
if (!fs.existsSync(shopDataPath)) {
  logError('Fichier lib/shop-data.ts introuvable.');
} else {
  const content = fs.readFileSync(shopDataPath, 'utf8');
  const sizesMatch = content.match(/export const SIZES = \[([^\]]+)\]/);
  if (!sizesMatch) {
    logError('export const SIZES introuvable dans lib/shop-data.ts.');
  } else {
    const sizes = [...sizesMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    if (sizes.length !== EXPECTED_SIZES.length || sizes.some((s, i) => s !== EXPECTED_SIZES[i])) {
      logError(`SIZES non conforme : ${JSON.stringify(sizes)} (attendu ${JSON.stringify(EXPECTED_SIZES)}).`);
    } else {
      logSuccess(`SIZES aligné sur ${JSON.stringify(EXPECTED_SIZES)}.`);
    }
  }
}

// 4. Structure Atomic Design
let atomicOk = true;
for (const dir of ATOMIC_DIRS) {
  if (!fs.existsSync(path.join(componentsDir, dir))) {
    logError(`Dossier manquant : components/${dir}/`);
    atomicOk = false;
  }
}
if (atomicOk) logSuccess('Structure Atomic Design (atoms → pages).');

for (const legacy of ['components/shop', 'components/admin']) {
  if (fs.existsSync(path.join(root, legacy))) {
    logError(`Dossier legacy interdit : ${legacy}/ (utiliser components/organisms/)`);
  }
}
if (!fs.existsSync(path.join(root, 'components/shop')) && !fs.existsSync(path.join(root, 'components/admin'))) {
  logSuccess('Aucun dossier legacy components/{shop,admin}.');
}

// 5. Cœur catalogue : ne doit pas rouvrir le tiroir compte invité
const shopPagePath = path.join(root, 'components/templates/dingry-shop-page.tsx');
if (fs.existsSync(shopPagePath)) {
  const shopPage = fs.readFileSync(shopPagePath, 'utf8');
  const blocked =
    /openAuth\(\s*["']Connectez-vous pour retrouver votre sélection/.test(shopPage) ||
    /adding\s*&&\s*!shopAuth\.user/.test(shopPage);
  if (blocked) {
    logError(
      'Régression wishlist : le clic cœur catalogue ne doit pas appeler openAuth (toggleCatalogWishlistFavorite).',
    );
  } else if (!shopPage.includes('toggleCatalogWishlistFavorite')) {
    logError('dingry-shop-page.tsx doit utiliser toggleCatalogWishlistFavorite pour le catalogue.');
  } else {
    logSuccess('Wishlist catalogue sans tiroir compte invité (cœur → nav).');
  }
} else {
  logError('components/templates/dingry-shop-page.tsx introuvable.');
}

// 6. Carte produit : cœur hors bouton ouverture fiche
const productCardPath = path.join(root, 'components/molecules/product-card.tsx');
if (fs.existsSync(productCardPath)) {
  const productCard = fs.readFileSync(productCardPath, 'utf8');
  const hasIsolatedWishlist =
    productCard.includes('data-dingry-wishlist') &&
    productCard.includes('stopPropagation') &&
    /openRecto\s*&&\s*wishlistVisible/.test(productCard);
  if (!hasIsolatedWishlist) {
    logError('product-card.tsx : le cœur doit être isolé du bouton data-dingry-product-card-open.');
  } else {
    logSuccess('product-card : cœur isolé de l’ouverture fiche.');
  }
} else {
  logError('components/molecules/product-card.tsx introuvable.');
}

// 7. Gardes serveur API admin + upload CRM
const adminApiDir = path.join(root, 'app/api/admin');
const adminPublic = new Set(['login', 'logout', 'totp', 'session']);
if (fs.existsSync(adminApiDir)) {
  const routeFiles = collectFiles(adminApiDir).filter((f) => f.endsWith('route.ts'));
  let guardOk = true;
  for (const filePath of routeFiles) {
    const rel = path.relative(adminApiDir, filePath);
    const top = rel.split(path.sep)[0];
    if (adminPublic.has(top)) continue;
    const src = fs.readFileSync(filePath, 'utf8');
    if (!src.includes('requireAdmin')) {
      logError(`Route admin sans requireAdmin : app/api/admin/${rel.replace(/\\/g, '/')}`);
      guardOk = false;
    }
  }
  const uploadRoute = path.join(root, 'app/api/upload/route.ts');
  if (fs.existsSync(uploadRoute)) {
    const uploadSrc = fs.readFileSync(uploadRoute, 'utf8');
    if (!uploadSrc.includes('requireAdmin')) {
      logError('app/api/upload/route.ts doit appeler requireAdmin.');
      guardOk = false;
    }
  } else {
    logError('app/api/upload/route.ts introuvable.');
    guardOk = false;
  }
  if (guardOk) {
    logSuccess('Routes admin sensibles : requireAdmin présent (hors login/logout/totp/session).');
  }
} else {
  logError('app/api/admin introuvable.');
}

// 8. Journal CRM (JSON source unique)
try {
  execSync('node scripts/crm-changelog.mjs validate', { cwd: root, stdio: 'pipe', encoding: 'utf8' });
  logSuccess('Journal CRM valide (scripts/crm-changelog.mjs).');
} catch (err) {
  const detail = err.stdout?.trim() || err.stderr?.trim() || err.message;
  logError(`Journal CRM : ${detail}`);
}

console.log('');
if (errorsCount > 0) {
  console.error(`${RED}💥 ${errorsCount} erreur(s). Corrige avant push/commit.${RESET}\n`);
  process.exit(1);
}
console.log(`${GREEN}🚀 Invariants OK — code prêt.${RESET}\n`);
