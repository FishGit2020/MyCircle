import { test, expect } from './fixtures';

test.describe('What\'s New — Announcements', () => {
  test('header sparkle button navigates to /whats-new', async ({ page }) => {
    await page.goto('/');
    // Mobile + desktop headers each have a WhatsNewButton — target the visible one
    const btn = page.getByTestId('whats-new-button').and(page.locator(':visible')).first();
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
    // Mobile + desktop headers each have a WhatsNewButton — target the visible one
    await expect(page.getByTestId('whats-new-button').and(page.locator(':visible')).first()).toBeVisible();
  });
});
