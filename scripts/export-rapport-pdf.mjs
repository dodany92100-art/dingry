#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const htmlPath = path.join(root, "public", "DINGRY-rapport-avancees.html");
const pdfPath = path.join(root, "public", "DINGRY-rapport-avancees.pdf");
const fileUrl = `file://${htmlPath}`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(fileUrl, { waitUntil: "networkidle" });
await page.pdf({
  path: pdfPath,
  format: "A4",
  printBackground: true,
  margin: { top: "12mm", right: "14mm", bottom: "14mm", left: "14mm" },
});
await browser.close();
console.log(`PDF : ${pdfPath}`);
