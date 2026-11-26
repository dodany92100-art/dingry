/**
 * Valide / regroupe une feuille CATALOGUE (CSV ou JSON).
 *
 * Usage :
 *   npm run import:catalog-sheet -- data/examples/fyma-catalog-sheet.sample.json
 *   npm run import:catalog-sheet -- --dry-save data/examples/fyma-catalog-sheet.sample.json
 *   npm run import:catalog-sheet -- --save-admin data/examples/fyma-catalog-sheet.sample.json
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import {
  catalogSheetCandidateToAdminDraft,
  catalogSheetCrmCandidates,
  catalogSheetParseSummary,
  catalogSheetSummaryHeadline,
  formatCatalogSheetIssueLine,
  groupCatalogSheetByModelRef,
  parseCatalogSheetCsv,
  parseCatalogSheetJson,
} from "../lib/catalog/catalog-sheet";
import { catalogSheetCsvFromWorkbookBuffer, isCatalogSpreadsheetFileName } from "../lib/catalog/catalog-sheet-workbook";

config({ path: path.join(process.cwd(), ".env.local") });
config({ path: path.join(process.cwd(), ".env") });

function filterFileArg(argv: string[]): string | undefined {
  return argv.find(
    (a, idx) =>
      idx > 1 &&
      !a.startsWith("-") &&
      (a.endsWith(".json") ||
        a.endsWith(".csv") ||
        a.endsWith(".xlsx") ||
        a.endsWith(".xls") ||
        a.includes("catalog")),
  );
}

function printDiagnostics(label: string, summary: ReturnType<typeof catalogSheetParseSummary>) {
  console.log(`\n${label}`);
  console.log(`   ${catalogSheetSummaryHeadline(summary)}`);
  if (summary.errors.length > 0) {
    console.log("\n   — Erreurs (lignes à corriger) —");
    for (const issue of summary.errors) {
      console.log(`   ${formatCatalogSheetIssueLine(issue).replace(/\n/g, "\n   ")}`);
    }
  }
  if (summary.warnings.length > 0) {
    console.log("\n   — Avertissements —");
    for (const issue of summary.warnings) {
      console.log(`   ${formatCatalogSheetIssueLine(issue).replace(/\n/g, "\n   ")}`);
    }
  }
}

async function main() {
  const exportCrm = process.argv.includes("--export-crm");
  const saveAdmin = process.argv.includes("--save-admin");
  const drySave = process.argv.includes("--dry-save");
  const mergeOverwrite = process.argv.includes("--merge-text-overwrite");
  const fileArg = filterFileArg(process.argv);
  const inputPath = path.resolve(
    process.cwd(),
    fileArg ?? "data/examples/fyma-catalog-sheet.sample.json",
  );

  const lowerPath = inputPath.toLowerCase();
  let parsed: ReturnType<typeof parseCatalogSheetCsv>;
  if (isCatalogSpreadsheetFileName(inputPath)) {
    const buffer = await readFile(inputPath);
    const csvText = catalogSheetCsvFromWorkbookBuffer(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
    parsed = parseCatalogSheetCsv(csvText);
  } else if (lowerPath.endsWith(".csv")) {
    const raw = await readFile(inputPath, "utf8");
    parsed = parseCatalogSheetCsv(raw);
  } else {
    const raw = await readFile(inputPath, "utf8");
    parsed = parseCatalogSheetJson(JSON.parse(raw) as unknown);
  }

  const summary = catalogSheetParseSummary(parsed.rows, parsed.issues);

  console.log(`\n📋 Feuille : ${inputPath}`);
  printDiagnostics("📊 Diagnostic", summary);

  if (summary.errorCount > 0) {
    process.exit(1);
  }

  const byModel = groupCatalogSheetByModelRef(parsed.rows);
  console.log("\n🔗 Regroupement par Réf. Modèle :");
  for (const group of byModel) {
    console.log(`   ${group.modelRef} → ${group.rows.length} variante(s)`);
  }

  const { candidates, issues: crmIssues } = catalogSheetCrmCandidates(parsed.rows);
  const crmSummary = catalogSheetParseSummary(parsed.rows, [...parsed.issues, ...crmIssues]);
  if (crmSummary.warnings.length > summary.warnings.length) {
    printDiagnostics("📎 Regroupement CRM", crmSummary);
  }

  console.log(`\n🧩 Fiches CRM (modèle + coloris) : ${candidates.length}`);
  for (const c of candidates) {
    console.log(
      `   ${c.modelRef} · ${c.color} · ${c.unitPriceEuro} € · tailles [${c.sizes.join(", ")}] · SKU×${c.variantSkus.length}`,
    );
  }

  if (exportCrm) {
    const outPath = inputPath.replace(/\.(json|csv)$/i, ".crm-draft.json");
    const payload = {
      generatedAt: new Date().toISOString(),
      source: path.basename(inputPath),
      variantCount: parsed.rows.length,
      candidates: candidates.map((c) => ({
        ...c,
        adminDraft: catalogSheetCandidateToAdminDraft(c),
      })),
    };
    await writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    console.log(`\n💾 Export CRM draft : ${outPath}`);
  }

  if (drySave || saveAdmin) {
    const { applyCatalogSheetImport } = await import("../lib/admin/apply-catalog-sheet-import");
    const report = await applyCatalogSheetImport({
      candidates,
      dryRun: !saveAdmin,
      mergeText: mergeOverwrite ? "overwrite" : "fill-empty",
    });

    console.log(`\n🗄️  Persistance admin (${saveAdmin ? "ÉCRITURE" : "simulation --dry-save"}) :`);
    console.log(`   Créations : ${report.created.length}`);
    console.log(`   Mises à jour : ${report.updated.length}`);
    console.log(`   Inchangées : ${report.unchanged.length}`);
    console.log(`   Erreurs : ${report.errors.length}`);
    for (const item of report.created) {
      console.log(
        `   + ${item.importKey} · SKU ${item.primarySku}${item.productId ? ` · id ${item.productId}` : ""}`,
      );
    }
    for (const item of report.updated) {
      console.log(`   ~ ${item.importKey} · id ${item.productId} · SKU ${item.primarySku}`);
    }
    for (const item of report.errors) {
      console.log(`   ! ${item.importKey} — ${item.message}`);
    }
    if (report.genderPendingSchema) {
      console.log(
        `\nℹ️  Genre : présent dans la feuille mais aucune colonne \`products\` dédiée (non importé).`,
      );
    }
    if (report.unmatchedFields.length > 0) {
      console.log(`   Champs feuille sans schéma DB : ${report.unmatchedFields.join(", ")}`);
    }

    if (report.errors.length > 0) {
      process.exit(1);
    }
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});