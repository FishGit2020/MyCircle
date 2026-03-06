import { test, expect } from './fixtures';

test.describe('Doc Scanner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/doc-scanner');
  });

  test('renders page without crash', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('breadcrumb shows Doc Scanner', async ({ page }) => {
    await expect(page.getByText('Doc Scanner').first()).toBeVisible({ timeout: 15_000 });
  });

  test('shows page title or loading state', async ({ page }) => {
    // MFE loads asynchronously — check that the heading eventually appears
    const title = page.getByRole('heading', { name: /doc scanner|文档扫描|esc.ner/i }).first();
    await expect(title).toBeVisible({ timeout: 20_000 });
  });

  test('shows capture and upload options', async ({ page }) => {
    // Wait for the MFE to load and show the capture/upload buttons
    await expect(page.getByText(/capture|capturar|拍摄/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/upload image|subir imagen|上传图片/i).first()).toBeVisible();
  });
});
