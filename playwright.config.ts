import { defineConfig } from '@playwright/test';

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, '') ??
  process.env.BASE_URL?.replace(/\/$/, '') ??
  'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './scripts',
  testMatch: '**/*e2e*.spec.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
});
