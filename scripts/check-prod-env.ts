/**
 * Contrôle des variables Vercel Production avant déploiement (sans afficher les secrets).
 * Usage : npx tsx scripts/check-prod-env.ts
 */

import { MIN_CRON_SECRET_LENGTH } from "../lib/cron-auth";

type Check = { name: string; ok: boolean; hint: string };

function present(name: string, minLength = 1): Check {
  const value = process.env[name]?.trim() ?? "";
  const ok = value.length >= minLength;
  return {
    name,
    ok,
    hint: ok ? "ok" : minLength > 1 ? `requis (≥ ${minLength} caractères)` : "requis",
  };
}

function paypalLive(): Check {
  const env = process.env.PAYPAL_ENV?.trim().toLowerCase() ?? "";
  const ok = env === "" || env === "live";
  return {
    name: "PAYPAL_ENV",
    ok,
    hint: ok ? "ok" : "doit être live ou absent en prod (pas sandbox)",
  };
}

function stockPrefix(): Check {
  const prefix = process.env.STOCK_KEY_PREFIX?.trim();
  if (!prefix) {
    return { name: "STOCK_KEY_PREFIX", ok: true, hint: "ok (défaut dingry:)" };
  }
  const ok = prefix === "dingry:";
  return {
    name: "STOCK_KEY_PREFIX",
    ok,
    hint: ok ? "ok" : 'doit être "dingry:" en prod',
  };
}

function turnstileHostname(): Check {
  const raw = process.env.TURNSTILE_EXPECTED_HOSTNAME?.trim() ?? "";
  const ok = raw.length > 0;
  return {
    name: "TURNSTILE_EXPECTED_HOSTNAME",
    ok,
    hint: ok ? "ok" : 'requis en prod (ex. "dingry.com,www.dingry.com")',
  };
}

function main(): void {
  const checks: Check[] = [
    present("NEXT_PUBLIC_PAYPAL_CLIENT_ID"),
    present("PAYPAL_CLIENT_SECRET"),
    present("PAYPAL_WEBHOOK_ID", 8),
    paypalLive(),
    present("ADMIN_TOTP_SECRET", 16),
    present("ADMIN_SESSION_SECRET", 32),
    present("CRON_SECRET", MIN_CRON_SECRET_LENGTH),
    present("UPSTASH_REDIS_REST_URL"),
    present("UPSTASH_REDIS_REST_TOKEN"),
    present("BLOB_READ_WRITE_TOKEN"),
    present("TURNSTILE_SECRET_KEY"),
    present("NEXT_PUBLIC_TURNSTILE_SITE_KEY"),
    turnstileHostname(),
    present("RESEND_API_KEY"),
    present("OPS_ALERT_EMAIL"),
    present("OPS_ALERT_FROM"),
    stockPrefix(),
  ];

  const failed = checks.filter((check) => !check.ok);
  for (const check of checks) {
    console.log(`${check.ok ? "✓" : "✗"} ${check.name} — ${check.hint}`);
  }

  if (failed.length > 0) {
    console.error(`\n${failed.length} contrôle(s) en échec.`);
    process.exit(1);
  }
  console.log("\nContrôles prod OK (valeurs non affichées).");
}

main();
