#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';
const YELLOW = '\x1b[33m';
const CODE_EXT = /\.(tsx?|jsx?)$/;

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

console.log(`\n${YELLOW}🔍 Lancement du contrôle anti-régression DINGRY...${RESET}\n`);

const componentsDir = path.join(root, 'components');
const libDir = path.join(root, 'lib');
const componentsFiles = collectFiles(componentsDir);
const libFiles = collectFiles(libDir);

const re119 = /\?\?\s*119/;
const reConsole = /console\.log\(/;

let found119 = false;
let foundConsole = false;
let sizesChecked = false;

for (const file of componentsFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (re119.test(content)) {
    logError(`Fallback interdit '?? 119' trouvé dans : ${path.relative(root, file)}`);
    found119 = true;
  }
  if (reConsole.test(content)) {
    logError(`console.log de debug trouvé dans : ${path.relative(root, file)}`);
    foundConsole = true;
  }
}

const shopDataPath = path.join(libDir, 'shop-data.ts');

for (const file of libFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (re119.test(content)) {
    logError(`Fallback interdit '?? 119' trouvé dans : ${path.relative(root, file)}`);
    found119 = true;
  }
  if (file === shopDataPath) {
    sizesChecked = true;
    const sizesMatch = content.match(/export const SIZES = \[([^\]]+)\]/);
    if (sizesMatch) {
      const sizes = [...sizesMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
      const expected = ['S', 'M', 'L', 'XL', 'TU'];
      if (sizes.length !== expected.length || sizes.some((s, i) => s !== expected[i])) {
        logError(`Grille de tailles SIZES non conforme dans lib/shop-data.ts : ${JSON.stringify(sizes)}`);
      } else {
        logSuccess("Grille de tailles SIZES strictement alignée sur ['S', 'M', 'L', 'XL', 'TU'].");
      }
    } else {
      logError('Constante export const SIZES introuvable dans lib/shop-data.ts.');
    }
  }
}

if (!found119) logSuccess("Aucun fallback '?? 119' résiduel dans le code.");

if (!sizesChecked) {
  logError('Fichier lib/shop-data.ts introuvable.');
}

if (!foundConsole) logSuccess('Aucun console.log de debug dans components/.');

console.log('');
if (errorsCount > 0) {
  console.error(`${RED}💥 Vérification échouée avec ${errorsCount} erreur(s). Corrige-les avant le push !${RESET}\n`);
  process.exit(1);
}
console.log(`${GREEN}🚀 Tout est au vert ! Code propre et prêt pour la production.${RESET}\n`);
