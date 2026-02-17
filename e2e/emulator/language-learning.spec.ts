import { test, expect } from './fixtures';

test.describe('Language Learning — Emulator Smoke Tests', () => {
  test('chinese learning page loads and renders content', async ({ page }) => {
    await page.goto('/chinese');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
    // Should render the Chinese Learning component (or its fallback)
    await expect(page.locator('[data-testid="chinese-learning"], .bg-yellow-50')).toBeAttached();
  });

  test('english learning page loads and renders content', async ({ page }) => {
    await page.goto('/english');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
    // Should render the English Learning component (or its fallback)
    await expect(page.locator('[data-testid="english-learning"], .bg-yellow-50')).toBeAttached();
  });

  test('navigation between language pages works', async ({ page }) => {
    await page.goto('/chinese');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();

    await page.goto('/english');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();

    // Navigate back to home
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
