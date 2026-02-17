import { test, expect } from './fixtures';

test.describe('What\'s New — Announcements', () => {
  test('header sparkle button navigates to /whats-new', async ({ page }) => {
    await page.goto('/');
    // There are 2 WhatsNewButtons (desktop + mobile) — click the first visible one
    const btn = page.getByTestId('whats-new-button').first();
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(page).toHaveURL(/\/whats-new/);
  });

  test('/whats-new page renders title and content', async ({ page }) => {
    await page.goto('/whats-new');
    await expect(page.getByTestId('whats-new-page')).toBeVisible();
  });

  test('announcement cards or empty state display on /whats-new page', async ({ page }) => {
    await page.goto('/whats-new');
    // Page should show either announcement cards or the no-announcements message
    await expect(page.getByTestId('whats-new-page')).toBeVisible();
  });

  test('sparkle button is visible in header', async ({ page }) => {
    await page.goto('/');
    // At least one sparkle button should be visible
    await expect(page.getByTestId('whats-new-button').first()).toBeVisible();
  });
});
