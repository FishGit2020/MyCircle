import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for integration tests — hits real APIs (no mocking).
 *
 * Usage:
 *   Local:    npx playwright test --config playwright.integration.config.ts --project local
 *   Deployed: npx playwright test --config playwright.integration.config.ts --project deployed
 */
export default defineConfig({
  testDir: './e2e/integration',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1, // serial to avoid rate-limiting external APIs
  reporter: [['html', { outputFolder: 'playwright-report-integration' }]],
  timeout: 30_000,
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'local',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
      },
    },
    {
      name: 'deployed',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://mycircle-dash.web.app',
      },
    },
  ],
  // Only start dev server for the local project
  webServer: process.env.PLAYWRIGHT_PROJECT === 'deployed'
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
