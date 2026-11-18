#!/usr/bin/env node
/**
 * Journal CRM (admin) — source unique : lib/admin/crm-release-history.json
 *
 *   npm run changelog:validate
 *   npm run changelog:add -- --title "…" --date "18 nov. 2026" --highlight "point 1" --highlight "point 2"
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const historyPath = path.join(root, "lib/admin/crm-release-history.json");

function readHistory() {
  if (!fs.existsSync(historyPath)) {
    throw new Error(`Fichier introuvable : ${path.relative(root, historyPath)}`);
  }
  const data = JSON.parse(fs.readFileSync(historyPath, "utf8"));
  if (!Array.isArray(data)) throw new Error("Le journal doit être un tableau JSON.");
  return data;
}

function writeHistory(entries) {
  fs.writeFileSync(historyPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function validateCrmReleaseHistory(entries) {
  const errors = [];
  const ids = new Set();
  const titles = new Set();

  for (const [index, entry] of entries.entries()) {
    if (!entry || typeof entry !== "object") {
      errors.push(`[${index}] entrée invalide`);
      continue;
    }
    for (const key of ["id", "deployedAtLabel", "title", "highlights"]) {
      if (!(key in entry)) errors.push(`[${index}] champ manquant : ${key}`);
    }
    if (typeof entry.id === "string") {
      if (ids.has(entry.id)) errors.push(`Id dupliqué : ${entry.id}`);
      ids.add(entry.id);
    }
    if (typeof entry.title === "string") {
      if (titles.has(entry.title)) errors.push(`Titre dupliqué : ${entry.title}`);
      titles.add(entry.title);
    }
    if (!Array.isArray(entry.highlights) || entry.highlights.length === 0) {
      errors.push(`[${entry.id ?? index}] highlights vide`);
    }
    if (Array.isArray(entry.highlights)) {
      const h = new Set();
      for (const line of entry.highlights) {
        if (h.has(line)) errors.push(`[${entry.id}] puce dupliquée : ${line.slice(0, 60)}…`);
        h.add(line);
      }
    }
    if (entry.versionHint != null && typeof entry.versionHint !== "string") {
      errors.push(`[${entry.id}] versionHint doit être une chaîne`);
    }
  }

  return errors;
}

function parseArgs(argv) {
  const out = { title: "", date: "", versionHint: "", highlights: [], id: "" };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--title") out.title = argv[++i] ?? "";
    else if (token === "--date") out.date = argv[++i] ?? "";
    else if (token === "--version" || token === "--version-hint") out.versionHint = argv[++i] ?? "";
    else if (token === "--highlight" || token === "-h") out.highlights.push(argv[++i] ?? "");
    else if (token === "--id") out.id = argv[++i] ?? "";
  }
  return out;
}

function cmdValidate() {
  const entries = readHistory();
  const errors = validateCrmReleaseHistory(entries);
  if (errors.length) {
    console.error("Journal CRM invalide :\n" + errors.map((e) => `  ✖ ${e}`).join("\n"));
    process.exit(1);
  }
  console.log(`✔ Journal OK (${entries.length} entrées, plus récent : ${entries[0]?.title ?? "—"})`);
}

function cmdAdd(argv) {
  const args = parseArgs(argv);
  if (!args.title.trim() || !args.date.trim() || args.highlights.length === 0) {
    console.error(
      "Usage : npm run changelog:add -- --title \"…\" --date \"18 nov. 2026\" --highlight \"…\" [--version 212]",
    );
    process.exit(1);
  }
  const entries = readHistory();
  const datePart = args.date.trim().replace(/\s+/g, "-").toLowerCase();
  const id = args.id.trim() || `${datePart}-${slugify(args.title)}`;
  if (entries.some((e) => e.id === id)) {
    console.error(`✖ Id déjà présent : ${id}`);
    process.exit(1);
  }
  const entry = {
    id,
    deployedAtLabel: args.date.trim(),
    title: args.title.trim(),
    highlights: args.highlights.map((h) => h.trim()).filter(Boolean),
  };
  if (args.versionHint.trim()) entry.versionHint = args.versionHint.trim();

  const next = [entry, ...entries];
  const errors = validateCrmReleaseHistory(next);
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  writeHistory(next);
  console.log(`✔ Entrée ajoutée en tête : ${entry.title} (${entry.id})`);
}

const [command, ...rest] = process.argv.slice(2);
if (command === "validate" || !command) {
  cmdValidate();
} else if (command === "add") {
  cmdAdd(rest);
} else {
  console.error("Commandes : validate | add");
  process.exit(1);
}