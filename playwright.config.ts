import { defineConfig } from '@playwright/test';

const managedServer = process.env.PLAYWRIGHT_MANAGED_SERVER === '1';
const reuseDev = process.env.PLAYWRIGHT_REUSE_DEV === '1';

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, '') ??
  process.env.BASE_URL?.replace(/\/$/, '') ??
  'http://localhost:3000';

const shopProbePath = (process.env.PLAYWRIGHT_SHOP_HOME ?? '/websitedx').replace(/\/$/, '') || '/websitedx';
const webServerUrl = `${baseURL}${shopProbePath.startsWith('/') ? shopProbePath : `/${shopProbePath}`}`;

const devPort = (() => {
  try {
    return new URL(baseURL).port || '3000';
  } catch {
    return '3000';
  }
})();

export default defineConfig({
  testDir: './scripts',
  testMatch: '**/*e2e*.spec.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL,
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 800 },
  },
  webServer: managedServer
    ? {
        command: `npm run dev -- --port ${devPort}`,
        url: webServerUrl,
        reuseExistingServer: false,
        timeout: 180_000,
        env: {
          ...process.env,
          DINGRY_PUBLIC_HOME: process.env.DINGRY_PUBLIC_HOME ?? 'shop',
          DINGRY_TEASER_GATE: process.env.DINGRY_TEASER_GATE ?? 'off',
        },
      }
    : undefined,
});
