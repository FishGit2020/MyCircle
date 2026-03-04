import { test, expect } from './fixtures';

test.describe('Immigration Tracker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/immigration');
  });

  test('renders page without crash', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('breadcrumb shows Immigration', async ({ page }) => {
    await expect(page.getByText(/immigration|inmigraci|移民/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('MFE content loads', async ({ page }) => {
    // Wait for the MFE to load — either the heading or a sign-in message appears in main
    const main = page.locator('main');
    await expect(main).toBeVisible({ timeout: 20_000 });
    const mainText = await main.textContent({ timeout: 20_000 });
    expect(mainText).toBeTruthy();
  });
});
