import { test, expect } from './fixtures';

test.describe('Voice Input', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ai');
  });

  test('shows voice input button when SpeechRecognition is supported', async ({ page }) => {
    // Inject mock SpeechRecognition before the page loads components
    await page.evaluate(() => {
      (window as unknown as Record<string, unknown>).SpeechRecognition = class {
        start() {}
        stop() {}
        abort() {}
        onresult: (() => void) | null = null;
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
      };
    });

    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: /AI Assistant/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /voice input/i })).toBeVisible();
  });

  test('has accessible chat input alongside voice button', async ({ page }) => {
    await expect(page.getByPlaceholder(/ask me about weather/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /send message/i })).toBeVisible();
  });
});
