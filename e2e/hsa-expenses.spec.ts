import { test, expect } from './fixtures';

test.describe('HSA Expenses', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/hsa-expenses');
  });

  test('renders page without crash', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('breadcrumb shows HSA Expenses', async ({ page }) => {
    await expect(page.getByText(/hsa|expenses|gastos/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('MFE content loads', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible({ timeout: 20_000 });
    const mainText = await main.textContent({ timeout: 20_000 });
    expect(mainText).toBeTruthy();
  });
});
