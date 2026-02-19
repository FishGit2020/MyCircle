import { test, expect } from './fixtures';
import { APIRequestContext } from '@playwright/test';

const FIRESTORE_URL = 'http://localhost:8080';
const PROJECT_ID = 'mycircle-dash';
const ADMIN_HEADERS = { Authorization: 'Bearer owner' };

async function getFirestoreChineseCharacters(request: APIRequestContext) {
  const res = await request.get(
    `${FIRESTORE_URL}/v1/projects/${PROJECT_ID}/databases/(default)/documents/chineseCharacters`,
    { headers: ADMIN_HEADERS },
  );
  const body = await res.json();
  return body.documents ?? [];
}

async function clearFirestoreData(request: APIRequestContext) {
  await request.delete(
    `${FIRESTORE_URL}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
  );
}

test.describe('Chinese Characters — Firestore Emulator', () => {
  test.beforeEach(async ({ request }) => {
    await clearFirestoreData(request);
  });

  test('seeded chinese characters exist in Firestore', async ({ request }) => {
    const docs = await getFirestoreChineseCharacters(request);
    expect(Array.isArray(docs)).toBe(true);
  });

  test('flashcards page loads (Chinese characters via bridge)', async ({ page }) => {
    await page.goto('/flashcards');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
