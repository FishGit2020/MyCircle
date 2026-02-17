import { test, expect } from './fixtures';
import { APIRequestContext } from '@playwright/test';

const FIRESTORE_URL = 'http://localhost:8080';
const PROJECT_ID = 'mycircle-dash';
const ADMIN_HEADERS = { Authorization: 'Bearer owner' };

async function seedAnnouncement(request: APIRequestContext, data: Record<string, any>) {
  await request.post(
    `${FIRESTORE_URL}/v1/projects/${PROJECT_ID}/databases/(default)/documents/announcements`,
    {
      headers: ADMIN_HEADERS,
      data: {
        fields: {
          title: { stringValue: data.title },
          description: { stringValue: data.description },
          icon: { stringValue: data.icon || 'feature' },
          createdAt: { timestampValue: new Date().toISOString() },
        },
      },
    },
  );
}

async function clearFirestoreData(request: APIRequestContext) {
  await request.delete(
    `${FIRESTORE_URL}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
  );
}

test.describe('Announcements — Firestore Emulator', () => {
  test.beforeEach(async ({ request }) => {
    await clearFirestoreData(request);
  });

  test('/whats-new page loads', async ({ page }) => {
    await page.goto('/whats-new');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
    // Should show the page title
    await expect(page.locator('h1')).toBeAttached();
  });

  test('/whats-new shows content after seeding', async ({ page, request }) => {
    await seedAnnouncement(request, {
      title: 'E2E Test Feature',
      description: 'This is a test announcement from e2e',
      icon: 'feature',
    });

    await page.goto('/whats-new');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('sparkle button is present on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    // At least one whats-new button should be in the DOM (desktop + mobile instances)
    const count = await page.getByTestId('whats-new-button').count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('navigating to /whats-new works', async ({ page }) => {
    await page.goto('/whats-new');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/whats-new/);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
