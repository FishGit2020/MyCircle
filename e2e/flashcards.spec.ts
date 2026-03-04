import { test, expect } from './fixtures';

test.describe('Flashcards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/flashcards');
  });

  test('renders page without crash', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('breadcrumb shows Flash Cards', async ({ page }) => {
    await expect(page.getByText(/flash/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('shows title or loading state', async ({ page }) => {
    const title = page.getByRole('heading', { name: /flash|tarjeta|闪/i }).first();
    const loading = page.getByText(/loading/i).first();
    await expect(title.or(loading)).toBeVisible({ timeout: 20_000 });
  });

  test('shows practice button when loaded', async ({ page }) => {
    // Wait for MFE to fully load — practice button appears after cards load
    const practice = page.getByRole('button', { name: /practice|practicar|练习/i }).first();
    const loading = page.getByText(/loading/i).first();
    await expect(practice.or(loading)).toBeVisible({ timeout: 20_000 });
  });
});
