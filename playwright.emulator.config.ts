import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for emulator E2E tests.
 * Runs against the Firebase Hosting emulator (port 5000).
 * No webServer — emulators are started externally via `firebase emulators:exec`.
 */
export default defineConfig({
  testDir: './e2e/emulator',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Serial — emulator state is shared
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // No webServer — emulators must be started before running tests
});
