#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const alias = "dingry-git-master-days-projects-36e5dc27.vercel.app";

const out = execFileSync("vercel", ["deploy", "--yes"], {
  cwd: root,
  encoding: "utf8",
});
const match = out.match(/https:\/\/dingry-[a-z0-9-]+-days-projects-36e5dc27\.vercel\.app/);
if (!match) {
  console.error("URL Preview introuvable dans la sortie vercel deploy.");
  process.exit(1);
}
const url = match[0];
execFileSync("vercel", ["alias", "set", url.replace("https://", ""), alias], {
  cwd: root,
  stdio: "inherit",
});
console.log(`Preview stable : https://${alias}`);
