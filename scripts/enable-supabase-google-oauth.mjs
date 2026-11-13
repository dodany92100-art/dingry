#!/usr/bin/env node
/**
 * Active Google OAuth sur le projet Supabase lié (Management API).
 * Prérequis dans .env.local (non commités) :
 *   SUPABASE_ACCESS_TOKEN=sbp_...   (dashboard → Account → Access Tokens)
 *   SUPABASE_GOOGLE_CLIENT_ID=...
 *   SUPABASE_GOOGLE_CLIENT_SECRET=...
 *
 * Usage : node scripts/enable-supabase-google-oauth.mjs
 */
import { config as loadDotenv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
loadDotenv({ path: path.join(root, ".env") });
loadDotenv({ path: path.join(root, ".env.local"), override: true });

const PROJECT_REF = "qzpcednlckcqjyhyyayp";
const token = (process.env.SUPABASE_ACCESS_TOKEN ?? "").trim();
const clientId = (process.env.SUPABASE_GOOGLE_CLIENT_ID ?? "").trim();
const clientSecret = (process.env.SUPABASE_GOOGLE_CLIENT_SECRET ?? "").trim();

function need(name, value) {
  if (!value) {
    console.error(`Manquant : ${name} dans .env.local`);
    process.exit(1);
  }
}

need("SUPABASE_ACCESS_TOKEN", token);
need("SUPABASE_GOOGLE_CLIENT_ID", clientId);
need("SUPABASE_GOOGLE_CLIENT_SECRET", clientSecret);

const body = {
  external_google_enabled: true,
  external_google_client_id: clientId,
  external_google_secret: clientSecret,
  site_url: "https://www.dingry.com",
  uri_allow_list:
    "https://www.dingry.com/**,http://localhost:3000/**,https://dingry.com/**",
};

const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

const text = await response.text();
if (!response.ok) {
  console.error(`Échec PATCH auth (${response.status}):`, text.slice(0, 500));
  process.exit(1);
}

console.log("Google OAuth activé sur Supabase (dingry-db).");

const verify = await fetch(
  `https://qzpcednlckcqjyhyyayp.supabase.co/auth/v1/authorize?provider=google&redirect_to=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback`,
  {
    headers: {
      apikey: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim(),
      Authorization: `Bearer ${(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim()}`,
    },
    redirect: "manual",
  },
);

if (verify.status === 302 || verify.status === 303) {
  const loc = verify.headers.get("location") ?? "";
  console.log(verify.status === 302 ? "OK →" : "OK →", loc.includes("accounts.google.com") ? "redirect Google" : loc.slice(0, 80));
} else {
  const err = await verify.text();
  console.warn("Vérif authorize:", verify.status, err.slice(0, 200));
}
