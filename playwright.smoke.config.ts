import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for post-deploy smoke tests.
 * Runs against the live production site — no webServer needed.
 */
export default defineConfig({
  testDir: './e2e/smoke',
  fullyParallel: false,
  workers: 1,
  retries: 1,
  forbidOnly: !!process.env.CI,
  timeout: 45_000,
  reporter: process.env.CI ? 'html' : 'list',
  use: {
    baseURL: 'https://mycircle-dash.web.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
