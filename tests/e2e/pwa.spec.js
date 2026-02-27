// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('DRAGON-IA PWA', () => {
  test('loads the index page with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('DRAGON-IA');
  });

  test('displays the header', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header h1');
    await expect(header).toContainText('DRAGON-IA');
  });

  test('has a chat form with input and submit button', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#user-input');
    const button = page.locator('#chat-form button');
    await expect(input).toBeVisible();
    await expect(button).toBeVisible();
  });

  test('has PWA manifest link', async ({ page }) => {
    await page.goto('/');
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveAttribute('href', 'manifest.json');
  });

  test('has correct meta charset', async ({ page }) => {
    await page.goto('/');
    const charset = page.locator('meta[charset]');
    await expect(charset).toHaveAttribute('charset', 'UTF-8');
  });

  test('can submit a message in the chat', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#user-input');
    await input.fill('Cześć!');
    await page.locator('#chat-form button').click();

    const messages = page.locator('#messages .message');
    await expect(messages.first()).toBeVisible();
  });
});
