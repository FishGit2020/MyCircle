import { test as base, Page } from '@playwright/test';

/**
 * Emulator test fixtures.
 *
 * Unlike the main e2e fixtures, these do NOT mock API responses at the
 * browser level. Requests flow through the full emulated stack:
 *   Browser → Hosting Emulator (5000) → Functions Emulator (5001) → Mock API Server (4000)
 *
 * We only set up localStorage to dismiss onboarding.
 */

async function dismissOnboarding(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('mycircle-onboarding-complete', 'true');
  });
}

export const test = base.extend<{ emulatorSetup: void }>({
  emulatorSetup: [async ({ page }, use) => {
    await dismissOnboarding(page);
    await use();
  }, { auto: true }],
});

export { expect } from '@playwright/test';
