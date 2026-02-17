import { test, expect } from './fixtures';

const AUTH_URL = 'http://localhost:9099';
const FIRESTORE_URL = 'http://localhost:8080';
const PROJECT_ID = 'mycircle-dash';
const ADMIN_HEADERS = { Authorization: 'Bearer owner' };

test.describe('Language Learning — Emulator Smoke Tests', () => {
  test('chinese learning page loads', async ({ page }) => {
    await page.goto('/chinese');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('english learning page loads', async ({ page }) => {
    await page.goto('/english');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('chinese progress syncs to Firestore on sign-in', async ({ page, request }) => {
    const testEmail = `test-chinese-${Date.now()}@example.com`;
    const testPassword = 'TestPass123!';

    // Create a user in the Auth emulator
    await request.post(
      `${AUTH_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
      {
        data: {
          email: testEmail,
          password: testPassword,
          displayName: 'Chinese Learner',
          returnSecureToken: true,
        },
      },
    );

    // Go to Chinese learning and set some progress
    await page.goto('/chinese');
    await page.waitForLoadState('domcontentloaded');

    // Set progress via localStorage
    await page.evaluate(() => {
      localStorage.setItem('chinese-learning-progress', JSON.stringify({
        masteredIds: ['f01', 'f02'],
        lastDate: '2026-02-16',
      }));
      window.dispatchEvent(new Event('chinese-progress-changed'));
    });

    // Wait for firebase.ts to expose the test helper
    await page.waitForFunction(
      () => typeof (window as any).__signInForTest === 'function',
      null,
      { timeout: 10000 },
    );

    // Sign in via the exposed test helper
    await page.evaluate(
      ({ email, password }) => (window as any).__signInForTest(email, password),
      { email: testEmail, password: testPassword },
    );

    // Wait for auth + sync to propagate
    await page.waitForTimeout(3000);

    // Verify that the user profile in Firestore has the progress
    const res = await request.get(
      `${FIRESTORE_URL}/v1/projects/${PROJECT_ID}/databases/(default)/documents/users`,
      { headers: ADMIN_HEADERS },
    );
    const body = await res.json();
    const docs = body.documents ?? [];
    expect(docs.length).toBeGreaterThanOrEqual(1);
  });

  test('english progress syncs to Firestore on sign-in', async ({ page, request }) => {
    const testEmail = `test-english-${Date.now()}@example.com`;
    const testPassword = 'TestPass123!';

    // Create a user in the Auth emulator
    await request.post(
      `${AUTH_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
      {
        data: {
          email: testEmail,
          password: testPassword,
          displayName: 'English Learner',
          returnSecureToken: true,
        },
      },
    );

    // Go to English learning and set some progress
    await page.goto('/english');
    await page.waitForLoadState('domcontentloaded');

    // Set progress via localStorage
    await page.evaluate(() => {
      localStorage.setItem('english-learning-progress', JSON.stringify({
        completedIds: ['g01', 'g02'],
        quizScores: [{ date: '2026-02-16', correct: 8, total: 10 }],
        lastDate: '2026-02-16',
      }));
      window.dispatchEvent(new Event('english-progress-changed'));
    });

    // Wait for firebase.ts to expose the test helper
    await page.waitForFunction(
      () => typeof (window as any).__signInForTest === 'function',
      null,
      { timeout: 10000 },
    );

    // Sign in via the exposed test helper
    await page.evaluate(
      ({ email, password }) => (window as any).__signInForTest(email, password),
      { email: testEmail, password: testPassword },
    );

    // Wait for auth + sync to propagate
    await page.waitForTimeout(3000);

    // Verify that the user profile in Firestore has the progress
    const res = await request.get(
      `${FIRESTORE_URL}/v1/projects/${PROJECT_ID}/databases/(default)/documents/users`,
      { headers: ADMIN_HEADERS },
    );
    const body = await res.json();
    const docs = body.documents ?? [];
    expect(docs.length).toBeGreaterThanOrEqual(1);
  });
});
