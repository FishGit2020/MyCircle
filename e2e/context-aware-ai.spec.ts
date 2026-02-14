import { test, expect } from './fixtures';

test.describe('Context-Aware AI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ai');
  });

  test('renders AI assistant with title', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: /AI Assistant/i })).toBeVisible({ timeout: 15_000 });
  });

  test('shows suggested prompts including crypto', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: /AI Assistant/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('How are crypto prices today?')).toBeVisible();
  });

  test('shows weather suggestion prompt', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: /AI Assistant/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("What's the weather in New York?")).toBeVisible();
  });

  test('has accessible chat input', async ({ page }) => {
    const input = page.getByPlaceholder(/ask me about weather/i);
    await expect(input).toBeVisible({ timeout: 15_000 });
  });
});
