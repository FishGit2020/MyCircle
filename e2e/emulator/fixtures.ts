import { test as base, Page, APIRequestContext } from '@playwright/test';
import { randomUUID } from 'crypto';

const FIRESTORE_URL = 'http://localhost:8080';
const PROJECT_ID = 'mycircle-dash';
const ADMIN_HEADERS = { Authorization: 'Bearer owner' };

/**
 * Emulator test fixtures.
 *
 * Unlike the main e2e fixtures, these do NOT mock API responses at the
 * browser level. Requests flow through the full emulated stack:
 *   Browser → Hosting Emulator (5000) → Functions Emulator (5001) → Mock API Server (4000)
 *
 * Each test gets a unique testId for data isolation, enabling parallel execution.
 */

async function dismissOnboarding(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('mycircle-onboarding-complete', 'true');
  });
}

async function clearFirestoreData(request: APIRequestContext) {
  await request.delete(
    `${FIRESTORE_URL}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
  );
}

export const test = base.extend<{ emulatorSetup: void; testId: string; clearFirestore: void }>({
  testId: async ({}, use) => {
    await use(randomUUID().slice(0, 8));
  },
  clearFirestore: [async ({ request }, use) => {
    await clearFirestoreData(request);
    await use();
  }, { auto: false }],
  emulatorSetup: [async ({ page }, use) => {
    await dismissOnboarding(page);
    await use();
  }, { auto: true }],
});

export { expect } from '@playwright/test';
export { FIRESTORE_URL, PROJECT_ID, ADMIN_HEADERS };
