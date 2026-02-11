import { test, expect } from './fixtures';

test.describe('AI Assistant', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ai');
  });

  test('renders AI assistant page with title', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: /ai assistant/i })).toBeVisible({ timeout: 15_000 });
  });

  test('has a chat input', async ({ page }) => {
    await expect(page.getByPlaceholder(/ask me about/i)).toBeVisible({ timeout: 15_000 });
  });

  test('shows empty state initially', async ({ page }) => {
    await expect(page.getByText('Start a conversation')).toBeVisible({ timeout: 15_000 });
  });

  test('has accessible chat messages area', async ({ page }) => {
    const chatArea = page.getByRole('list', { name: /chat messages/i });
    await expect(chatArea).toBeVisible({ timeout: 15_000 });
    await expect(chatArea).toHaveAttribute('aria-live', 'polite');
  });

  test('can send a message and receive response', async ({ page }) => {
    const input = page.getByPlaceholder(/ask me about/i);
    await expect(input).toBeVisible({ timeout: 15_000 });

    await input.fill('What is the weather in Tokyo?');
    await page.getByRole('button', { name: /send message/i }).click();

    // User message should appear
    await expect(page.getByText('What is the weather in Tokyo?')).toBeVisible({ timeout: 10_000 });

    // AI response should appear (from mock)
    await expect(page.getByText(/22°C/)).toBeVisible({ timeout: 10_000 });
  });

  test('shows tool calls on response', async ({ page }) => {
    const input = page.getByPlaceholder(/ask me about/i);
    await expect(input).toBeVisible({ timeout: 15_000 });

    await input.fill('Weather in Tokyo');
    await page.getByRole('button', { name: /send message/i }).click();

    // Should show weather tool usage indicator
    await expect(page.getByText('Weather lookup')).toBeVisible({ timeout: 10_000 });
  });

  test('has send button that is disabled when input is empty', async ({ page }) => {
    const sendButton = page.getByRole('button', { name: /send message/i });
    await expect(sendButton).toBeVisible({ timeout: 15_000 });
    await expect(sendButton).toBeDisabled();
  });

  test('clears input after sending', async ({ page }) => {
    const input = page.getByPlaceholder(/ask me about/i);
    await expect(input).toBeVisible({ timeout: 15_000 });

    await input.fill('Hello');
    await page.getByRole('button', { name: /send message/i }).click();

    await expect(input).toHaveValue('');
  });
});
