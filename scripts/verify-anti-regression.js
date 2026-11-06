#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

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

console.log('');
if (errorsCount > 0) {
  console.error(`${RED}💥 ${errorsCount} erreur(s). Corrige avant push/commit.${RESET}\n`);
  process.exit(1);
}
console.log(`${GREEN}🚀 Invariants OK — code prêt.${RESET}\n`);
