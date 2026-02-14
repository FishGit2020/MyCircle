import { test, expect } from './fixtures';
import { APIRequestContext } from '@playwright/test';

const FIRESTORE_URL = 'http://localhost:8080';
const AUTH_URL = 'http://localhost:9099';
const PROJECT_ID = 'mycircle-dash';

/**
 * Read all feedback documents from the Firestore emulator REST API.
 */
async function getFirestoreFeedback(request: APIRequestContext) {
  const res = await request.get(
    `${FIRESTORE_URL}/v1/projects/${PROJECT_ID}/databases/(default)/documents/feedback`,
  );
  const body = await res.json();
  return body.documents ?? [];
}

/**
 * Delete all feedback documents for test isolation.
 */
async function clearFirestoreFeedback(request: APIRequestContext) {
  const docs = await getFirestoreFeedback(request);
  for (const doc of docs) {
    await request.delete(`${FIRESTORE_URL}/v1/${doc.name}`);
  }
}

test.describe('Feedback → Firestore Emulator', () => {
  test('anonymous feedback reaches Firestore', async ({ page, request }) => {
    await clearFirestoreFeedback(request);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open feedback modal
    await page.getByRole('button', { name: /feedback/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Select "Bug Report" category
    await page.locator('#fb-category').selectOption('bug');

    // Click 4th star for rating
    await page.getByRole('radio', { name: /4 star/i }).click();

    // Type a message
    const testMessage = `E2E anonymous feedback ${Date.now()}`;
    await page.locator('#fb-message').fill(testMessage);

    // Submit
    await page.getByRole('button', { name: /submit feedback/i }).click();

    // Wait for success indicator
    await expect(page.getByText(/thanks for your feedback/i)).toBeVisible({ timeout: 10000 });

    // Verify the document landed in Firestore
    const docs = await getFirestoreFeedback(request);
    expect(docs.length).toBeGreaterThanOrEqual(1);

    const feedback = docs.find((d: any) => {
      const fields = d.fields;
      return fields?.message?.stringValue === testMessage;
    });
    expect(feedback).toBeTruthy();

    const fields = feedback.fields;
    expect(fields.category.stringValue).toBe('bug');
    expect(fields.rating.integerValue).toBe('4');
    expect(fields.uid.nullValue).toBeDefined();
  });

  test('logged-in feedback includes user info', async ({ page, request }) => {
    await clearFirestoreFeedback(request);

    const testEmail = `test-feedback-${Date.now()}@example.com`;
    const testPassword = 'TestPass123!';
    const testDisplayName = 'Feedback Tester';

    // Create a user in the Auth emulator
    await request.post(
      `${AUTH_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
      {
        data: {
          email: testEmail,
          password: testPassword,
          displayName: testDisplayName,
          returnSecureToken: true,
        },
      },
    );

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Sign in via the exposed test helper
    await page.evaluate(
      ({ email, password }) => (window as any).__signInForTest(email, password),
      { email: testEmail, password: testPassword },
    );

    // Wait for auth state to propagate (user name appears in header)
    await page.waitForTimeout(2000);

    // Open feedback modal and submit
    await page.getByRole('button', { name: /feedback/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.locator('#fb-category').selectOption('feature');

    const testMessage = `E2E logged-in feedback ${Date.now()}`;
    await page.locator('#fb-message').fill(testMessage);

    await page.getByRole('button', { name: /submit feedback/i }).click();
    await expect(page.getByText(/thanks for your feedback/i)).toBeVisible({ timeout: 10000 });

    // Verify document has user info
    const docs = await getFirestoreFeedback(request);
    const feedback = docs.find((d: any) => {
      const fields = d.fields;
      return fields?.message?.stringValue === testMessage;
    });
    expect(feedback).toBeTruthy();

    const fields = feedback.fields;
    expect(fields.category.stringValue).toBe('feature');
    expect(fields.email.stringValue).toBe(testEmail);
    expect(fields.uid.stringValue).toBeTruthy();
  });

  test('empty message prevents submission', async ({ page, request }) => {
    await clearFirestoreFeedback(request);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open feedback modal
    await page.getByRole('button', { name: /feedback/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Leave message empty — submit button should be disabled
    const submitBtn = page.getByRole('button', { name: /submit feedback/i });
    await expect(submitBtn).toBeDisabled();

    // Verify no document was created
    const docs = await getFirestoreFeedback(request);
    expect(docs.length).toBe(0);
  });
});
