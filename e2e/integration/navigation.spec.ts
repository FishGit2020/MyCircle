import { test, expect } from '@playwright/test';

/**
 * Integration tests for app navigation — verifies all major routes load.
 * No mocking — tests that the app shell and MFE remotes load correctly.
 */
test.describe('Navigation Integration', () => {
  const routes = [
    { path: '/', name: 'Home', expectedText: /MyCircle|weather|search/i },
    { path: '/stocks', name: 'Stocks', expectedText: /stock|search|market/i },
    { path: '/podcasts', name: 'Podcasts', expectedText: /podcast|trending|search|discover/i },
    { path: '/ai', name: 'AI Assistant', expectedText: /assistant|chat|ai|message/i },
    { path: '/compare', name: 'Compare', expectedText: /compare|cities|favorite/i },
  ];

  for (const route of routes) {
    test(`${route.name} page (${route.path}) loads without crashing`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.locator('#root')).toBeVisible({ timeout: 15_000 });

      // Page should render meaningful content
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
      expect(bodyText!.length).toBeGreaterThan(10);

      // No unhandled exceptions in the UI
      expect(bodyText).not.toContain('Application error');
      expect(bodyText).not.toContain('Cannot read properties of undefined');
      expect(bodyText).not.toContain('Cannot read properties of null');
    });
  }

  test('header navigation links are present', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible({ timeout: 15_000 });

    // Check nav links exist
    const homeLink = page.getByRole('link', { name: /home/i });
    const stocksLink = page.getByRole('link', { name: /stock/i });
    const podcastsLink = page.getByRole('link', { name: /podcast/i });

    const hasHome = await homeLink.isVisible().catch(() => false);
    const hasStocks = await stocksLink.isVisible().catch(() => false);
    const hasPodcasts = await podcastsLink.isVisible().catch(() => false);

    // At least one nav link should be visible
    expect(hasHome || hasStocks || hasPodcasts).toBe(true);
  });
});
