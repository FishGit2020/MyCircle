import { test, expect } from './fixtures';

test.describe('Child Development', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/child-dev');
  });

  test('renders page with title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /child|desarrollo|儿童/i }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('shows setup form when no child data exists', async ({ page }) => {
    // Without child data, shows the setup form with name and birth date inputs
    const nameInput = page.locator('input[type="text"]').first();
    const dateInput = page.locator('input[type="date"]');
    await expect(nameInput.or(dateInput).first()).toBeVisible({ timeout: 15_000 });
  });

  test('shows Get Started button in setup view', async ({ page }) => {
    // Wait for MFE chunk to finish loading before asserting
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByRole('button', { name: /get started|comenzar|开始/i })
    ).toBeVisible({ timeout: 5_000 });
  });
});
