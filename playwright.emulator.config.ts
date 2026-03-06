import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for emulator E2E tests.
 * Runs against the Firebase Hosting emulator (port 5000).
 * No webServer — emulators are started externally via `firebase emulators:exec`.
 */
export default defineConfig({
  testDir: './e2e/emulator',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5000',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // No webServer — emulators must be started before running tests
});
