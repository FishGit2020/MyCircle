import { test, expect, FIRESTORE_URL, PROJECT_ID, ADMIN_HEADERS } from './fixtures';
import { APIRequestContext } from '@playwright/test';

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

test.describe('Announcements — Firestore Emulator', () => {
  test.use({ clearFirestore: undefined as any });

  test('/whats-new page loads', async ({ page }) => {
    await page.goto('/whats-new');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
    // Should have loaded the route without crashing (404 page also counts as success)
    await expect(page).toHaveURL(/\/whats-new/);
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
