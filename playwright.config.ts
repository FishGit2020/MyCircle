import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testIgnore: ['**/integration/**', '**/emulator/**', '**/smoke/**'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 10_000,
  workers: process.env.CI ? '50%' : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // In CI: serve the production build (pnpm build must run first).
  // Locally: start the dev server with all MFEs via concurrently.
  webServer: {
    command: process.env.CI ? 'pnpm start:static' : 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
