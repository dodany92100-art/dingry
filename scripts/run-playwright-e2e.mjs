#!/usr/bin/env node
/**
 * E2E boutique : /websitedx, gate teaser off si on démarre le serveur.
 * Un seul `next dev` par dépôt — si :3000 ne sert pas la boutique, on arrête ce processus puis Playwright lance le sien.
 */
import { spawnSync, execSync } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';

/** Next 16 dev : HMR bloqué pour 127.0.0.1 si l’hôte n’est pas dans allowedDevOrigins — préférer localhost. */
const defaultBase = 'http://localhost:3000';

async function shopReady(baseURL) {
  const base = baseURL.replace(/\/$/, '');
  try {
    const head = await fetch(`${base}/websitedx`, { redirect: 'manual' });
    if (head.status >= 300 && head.status < 400) {
      const loc = head.headers.get('location') ?? '';
      if (loc.includes('/admin')) return false;
    }
    if (head.status !== 200) return false;
    const api = await fetch(`${base}/api/catalog`);
    if (!api.ok) return false;
    const payload = await api.json().catch(() => null);
    const count = Array.isArray(payload?.products) ? payload.products.length : 0;
    return count > 0;
  } catch {
    return false;
  }
}

async function stopListenerOnPort(port) {
  try {
    const pids = execSync(`lsof -t -iTCP:${port} -sTCP:LISTEN`, { encoding: 'utf8' })
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    for (const pid of pids) {
      process.stderr.write(`E2E: arrêt du processus sur :${port} (pid ${pid})…\n`);
      try {
        process.kill(Number(pid), 'SIGTERM');
      } catch {
        /* déjà mort */
      }
    }
    if (pids.length) {
      await setTimeout(2000);
    }
  } catch {
    /* rien sur ce port */
  }
}

const reuseDev = process.env.PLAYWRIGHT_REUSE_DEV === '1';
let baseURL = process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, '') || defaultBase;
let managedServer = '0';

if (reuseDev) {
  if (!(await shopReady(baseURL))) {
    process.stderr.write(
      'E2E: PLAYWRIGHT_REUSE_DEV=1 mais /websitedx inaccessible (gate admin ?). ' +
        'Relance le dev avec DINGRY_TEASER_GATE=off ou retire PLAYWRIGHT_REUSE_DEV.\n',
    );
    process.exit(1);
  }
} else if (await shopReady(baseURL)) {
  process.stderr.write(`E2E: boutique OK sur ${baseURL}/websitedx — réutilisation du serveur existant.\n`);
} else {
  const port = new URL(baseURL).port || '3000';
  if (process.env.PLAYWRIGHT_KILL_DEV !== '0') {
    await stopListenerOnPort(port);
  } else {
    process.stderr.write(
      'E2E: /websitedx inaccessible et PLAYWRIGHT_KILL_DEV=0 — impossible de démarrer un 2ᵉ next dev.\n',
    );
    process.exit(1);
  }
  managedServer = '1';
}

const env = {
  ...process.env,
  PLAYWRIGHT_SHOP_HOME: process.env.PLAYWRIGHT_SHOP_HOME ?? '/websitedx',
  PLAYWRIGHT_BASE_URL: baseURL,
  PLAYWRIGHT_MANAGED_SERVER: managedServer,
  PLAYWRIGHT_REUSE_DEV: managedServer === '1' ? '0' : '1',
  CI: managedServer === '1' ? (process.env.CI ?? '1') : process.env.CI,
  DINGRY_TEASER_GATE: process.env.DINGRY_TEASER_GATE ?? 'off',
};

const args = process.argv.slice(2);
const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['playwright', 'test', ...args],
  { stdio: 'inherit', env },
);

process.exit(result.status ?? 1);
