import { test, expect } from '@playwright/test';

test.describe('Doc Scanner', () => {
  test('navigates to doc-scanner page and renders', async ({ page }) => {
    await page.goto('/doc-scanner');
    // Wait for the page to load
    await expect(page.locator('h1')).toContainText(/doc scanner|文档扫描|Escáner/i);
  });

  test('shows capture and upload buttons', async ({ page }) => {
    await page.goto('/doc-scanner');
    // Should show camera capture and file upload options
    await expect(page.getByRole('button')).toHaveCount(2, { timeout: 10000 });
  });

  test('file input accepts images', async ({ page }) => {
    await page.goto('/doc-scanner');
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveAttribute('accept', 'image/*');
  });
});
