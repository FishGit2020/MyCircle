import { test, expect } from './fixtures';

test.describe('Daily Log', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/daily-log');
  });

  test('renders page without crash', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('breadcrumb shows Daily Log', async ({ page }) => {
    await expect(page.getByText(/daily log/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('MFE content loads', async ({ page }) => {
    // Wait for the MFE to load — either the heading or a sign-in message appears in main
    const main = page.locator('main');
    await expect(main).toBeVisible({ timeout: 20_000 });
    const mainText = await main.textContent({ timeout: 20_000 });
    expect(mainText).toBeTruthy();
  });
});
