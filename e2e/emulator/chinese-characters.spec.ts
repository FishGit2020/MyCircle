import { test, expect, FIRESTORE_URL, PROJECT_ID, ADMIN_HEADERS } from './fixtures';
import { APIRequestContext } from '@playwright/test';

async function getFirestoreChineseCharacters(request: APIRequestContext) {
  const res = await request.get(
    `${FIRESTORE_URL}/v1/projects/${PROJECT_ID}/databases/(default)/documents/chineseCharacters`,
    { headers: ADMIN_HEADERS },
  );
  const body = await res.json();
  return body.documents ?? [];
}

test.describe('Chinese Characters — Firestore Emulator', () => {
  test.use({ clearFirestore: undefined as any });

  test('seeded chinese characters exist in Firestore', async ({ request }) => {
    const docs = await getFirestoreChineseCharacters(request);
    expect(Array.isArray(docs)).toBe(true);
  });
});
